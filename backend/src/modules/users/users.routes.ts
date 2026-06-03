import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  updateProfileSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from '../../validators/user';
import { uuidParamSchema } from '../../validators/common';

const router = Router();

router.use(authenticate);

router.get('/me', controller.getMe);
router.put('/me', validate(updateProfileSchema), controller.updateMe);
router.put('/me/password', validate(changePasswordSchema), controller.changePassword);

router.get('/inspectors', requireRole(UserRole.ADMIN), controller.listInspectors);
router.get('/inspectors', requireRole(UserRole.ADMIN), controller.listInspectors);
router.get('/', requireRole(UserRole.ADMIN), controller.list);
router.post('/', requireRole(UserRole.ADMIN), validate(adminCreateUserSchema), controller.create);
router.put(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  validate(adminUpdateUserSchema),
  controller.update
);
router.delete(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  controller.remove
);

export default router;
