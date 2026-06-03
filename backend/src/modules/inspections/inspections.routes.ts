import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './inspections.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  scheduleInspectionSchema,
  completeInspectionSchema,
} from '../../validators/inspection';
import { uuidParamSchema } from '../../validators/common';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER),
  controller.list
);
router.get(
  '/:id',
  requireRole(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER),
  validate(uuidParamSchema, 'params'),
  controller.getById
);
router.post(
  '/',
  requireRole(UserRole.USER),
  validate(scheduleInspectionSchema),
  controller.schedule
);
router.patch(
  '/:id/complete',
  requireRole(UserRole.INSPECTOR),
  validate(uuidParamSchema, 'params'),
  validate(completeInspectionSchema),
  controller.complete
);

export default router;
