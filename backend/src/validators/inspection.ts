import { z } from 'zod';
import { InspectionStatus } from '@prisma/client';
import { todayOrFutureDateSchema } from './dateSchemas';

export const scheduleInspectionSchema = z.object({
  extinguisherId: z.string().uuid('Invalid extinguisher ID'),
  scheduledDate: todayOrFutureDateSchema,
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24-hour)'),
  notes: z.string().max(1000).optional(),
});

export const completeInspectionSchema = z.object({
  status: z.literal(InspectionStatus.COMPLETED),
  notes: z.string().max(1000).optional(),
});

export const assignInspectorSchema = z.object({
  assignedInspectorId: z.string().uuid('Invalid inspector ID'),
});
