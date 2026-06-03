import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../../validators/auth';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 */
router.post('/register', authLimiter, validate(registerSchema), controller.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 */
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), controller.resendOtp);

router.post('/login', authLimiter, validate(loginSchema), controller.login);

router.post('/logout', validate(refreshTokenSchema), controller.logout);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);

router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);

router.get('/me', authenticate, controller.me);

export default router;
