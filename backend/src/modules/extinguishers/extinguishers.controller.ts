import { Request, Response, NextFunction } from 'express';
import * as service from './extinguishers.service';
import { sendSuccess, sendMessage } from '../../lib/response';
import { parsePaginationSafe } from '../../lib/pagination';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.create(req.body);
    sendSuccess(res, item, 201);
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    const result = await service.findAll(req.user!.id, req.user!.role, page, limit);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.findById(
      String(req.params.id),
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.update(String(req.params.id), req.body);
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(String(req.params.id));
    sendMessage(res, result.message);
  } catch (e) {
    next(e);
  }
}
