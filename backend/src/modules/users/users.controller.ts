import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendMessage } from '../../lib/response';
import { parsePaginationSafe } from '../../lib/pagination';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getProfile(req.user!.id);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePaginationSafe(req.query as Record<string, unknown>);
    const result = await usersService.listUsers(page, limit);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function listInspectors(req: Request, res: Response, next: NextFunction) {
  try {
    const inspectors = await usersService.listInspectors();
    sendSuccess(res, inspectors);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    sendSuccess(res, user, 201);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(String(req.params.id), req.body);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.deleteUser(String(req.params.id));
    sendMessage(res, result.message);
  } catch (e) {
    next(e);
  }
}
