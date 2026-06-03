import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './maintenance.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createMaintenanceSchema } from '../../validators/maintenance';
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
  requireRole(UserRole.INSPECTOR),
  validate(createMaintenanceSchema),
  controller.create
);

export default router;
