import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './extinguishers.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createExtinguisherSchema,
  updateExtinguisherSchema,
} from '../../validators/extinguisher';
import { uuidParamSchema } from '../../validators/common';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER), controller.list);
router.get(
  '/:id',
  requireRole(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER),
  validate(uuidParamSchema, 'params'),
  controller.getById
);
router.post('/', requireRole(UserRole.ADMIN), validate(createExtinguisherSchema), controller.create);
router.put(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  validate(updateExtinguisherSchema),
  controller.update
);
router.delete(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  controller.remove
);

export default router;
