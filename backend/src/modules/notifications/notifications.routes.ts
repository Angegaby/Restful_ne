import { Router } from 'express';
import * as controller from './notifications.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uuidParamSchema } from '../../validators/common';

const router = Router();

router.use(authenticate);

router.get('/unread-count', controller.unreadCount);
router.get('/', controller.list);
router.patch('/:id/read', validate(uuidParamSchema, 'params'), controller.markRead);

export default router;
