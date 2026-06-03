import { z } from 'zod';
import {
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
} from '@prisma/client';
import { parseCalendarDate } from '../lib/dates';
import { expiryDateSchema, pastOrTodayDateSchema } from './dateSchemas';

const extinguisherBase = {
  serialNumber: z.string().trim().min(1, 'Serial number is required').max(100),
  location: z.string().trim().min(1, 'Location is required').max(255),
  type: z.nativeEnum(ExtinguisherType),
  size: z.nativeEnum(ExtinguisherSize),
  installationDate: pastOrTodayDateSchema,
  expiryDate: expiryDateSchema,
  status: z.nativeEnum(ExtinguisherStatus).optional(),
  assignedInspectorId: z.string().uuid().nullable().optional(),
};

function validateDates(data: { installationDate: string; expiryDate: string }) {
  const install = parseCalendarDate(data.installationDate);
  const expiry = parseCalendarDate(data.expiryDate);
  if (!install || !expiry) return false;
  return expiry >= install;
}

export const createExtinguisherSchema = z
  .object(extinguisherBase)
  .refine(validateDates, {
    message: 'Expiry date must be on or after installation date',
    path: ['expiryDate'],
  });

export const updateExtinguisherSchema = z
  .object({
    ...extinguisherBase,
    serialNumber: extinguisherBase.serialNumber.optional(),
    location: extinguisherBase.location.optional(),
    type: extinguisherBase.type.optional(),
    size: extinguisherBase.size.optional(),
    installationDate: extinguisherBase.installationDate.optional(),
    expiryDate: extinguisherBase.expiryDate.optional(),
  })
  .refine(
    (data) => {
      if (data.installationDate && data.expiryDate) {
        return validateDates({
          installationDate: data.installationDate,
          expiryDate: data.expiryDate,
        });
      }
      return true;
    },
    {
      message: 'Expiry date must be on or after installation date',
      path: ['expiryDate'],
    }
  );
