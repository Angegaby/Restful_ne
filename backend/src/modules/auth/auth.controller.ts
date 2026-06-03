import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendMessage } from '../../lib/response';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.refreshToken;
    if (token) await authService.logout(token);
    sendMessage(res, 'Logged out successfully');
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmailOtp(req.body.email, req.body.code);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendEmailOtp(req.body.email);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
}
