import { z } from 'zod';
import {
  validateExpiryCalendarDate,
  validatePastOrToday,
  validateTodayOrFuture,
} from '../lib/dates';

function addDateIssue(ctx: z.RefinementCtx, message: string) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message });
}

export const pastOrTodayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const result = validatePastOrToday(value);
    if (!result.ok) addDateIssue(ctx, result.message);
  });

export const todayOrFutureDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const result = validateTodayOrFuture(value);
    if (!result.ok) addDateIssue(ctx, result.message);
  });

export const expiryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const result = validateExpiryCalendarDate(value);
    if (!result.ok) addDateIssue(ctx, result.message);
  });
