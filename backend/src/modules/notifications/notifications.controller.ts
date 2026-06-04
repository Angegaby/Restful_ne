import { Request, Response, NextFunction } from 'express';
import * as service from './notifications.service';
import { sendSuccess } from '../../lib/response';
import { parsePaginationSafe } from '../../lib/pagination';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    const result = await service.listForUser(req.user!.id, unreadOnly, page, limit);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await service.unreadCount(req.user!.id);
    sendSuccess(res, { count });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.markRead(String(req.params.id), req.user!.id);
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
}
