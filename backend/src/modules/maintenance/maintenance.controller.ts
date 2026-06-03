import { Request, Response, NextFunction } from 'express';
import * as service from './maintenance.service';
import { sendSuccess } from '../../lib/response';
import { parsePaginationSafe } from '../../lib/pagination';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.create(req.user!.id, req.user!.role, req.body);
    sendSuccess(res, item, 201);
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    const result = await service.list(req.user!.id, req.user!.role, page, limit);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.getById(
      String(req.params.id),
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
}
