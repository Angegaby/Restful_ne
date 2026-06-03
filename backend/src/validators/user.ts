import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from './common';
import { UserRole } from '@prisma/client';

export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const adminCreateUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.nativeEnum(UserRole),
});

export const adminUpdateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  password: passwordSchema.optional(),
});
