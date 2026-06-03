import { z } from 'zod';
import {
  validateExpiryCalendarDate,
  validatePastOrToday,
  validateTodayOrFuture,
  parseCalendarDate,
} from './dates';

const pastOrTodayDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const r = validatePastOrToday(value);
    if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message });
  });

const todayOrFutureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const r = validateTodayOrFuture(value);
    if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message });
  });

const expiryDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const r = validateExpiryCalendarDate(value);
    if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message });
  });

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'First name required'),
  lastName: z.string().trim().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: passwordSchema,
});

export const extinguisherSchema = z
  .object({
    serialNumber: z.string().trim().min(1, 'Serial number required'),
    location: z.string().trim().min(1, 'Location required'),
    type: z.enum(['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL']),
    size: z.enum(['LB_1_5', 'LB_5', 'LB_9', 'LB_12']),
    installationDate: pastOrTodayDate,
    expiryDate: expiryDate,
    status: z.enum(['ACTIVE', 'EXPIRED', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
    assignedInspectorId: z.string().uuid().optional().or(z.literal('')),
  })
  .refine((d) => {
    const install = parseCalendarDate(d.installationDate);
    const expiry = parseCalendarDate(d.expiryDate);
    return install !== null && expiry !== null && expiry >= install;
  }, {
    message: 'Expiry must be on or after installation',
    path: ['expiryDate'],
  });

export const inspectionSchema = z.object({
  extinguisherId: z
    .string()
    .min(1, 'Please select a fire extinguisher')
    .uuid('Please select a valid fire extinguisher'),
  scheduledDate: todayOrFutureDate,
  scheduledTime: z
    .string()
    .min(1, 'Inspection time is required')
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour format HH:MM (e.g. 10:00)'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export const maintenanceSchema = z.object({
  extinguisherId: z.string().uuid('Select an extinguisher'),
  actionTaken: z.string().trim().min(1, 'Action required'),
  maintenanceDate: pastOrTodayDate,
  issuesIdentified: z.string().trim().min(1, 'Issues required'),
  notes: z.string().trim().min(1, 'Notes required'),
});
