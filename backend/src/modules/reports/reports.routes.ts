import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './reports.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

const reportRoles = [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.USER];

router.get('/dashboard', requireRole(...reportRoles), controller.dashboard);
router.get('/inventory', requireRole(...reportRoles), controller.inventory);
router.get('/inspections', requireRole(...reportRoles), controller.inspections);
router.get('/compliance', requireRole(...reportRoles), controller.compliance);
router.get('/maintenance', requireRole(...reportRoles), controller.maintenance);
router.get('/summary', requireRole(...reportRoles), controller.summary);
router.get('/summary/export', requireRole(...reportRoles), controller.exportSummary);

router.get(
  '/:type/export',
  requireRole(...reportRoles),
  controller.exportReport
);

export default router;
