import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../../lib/errors';
import { generateSecureToken, hashToken } from '../../lib/crypto';
import { createAndSendOtp, hashOtpCode } from '../../lib/otp';
import { sendPasswordResetEmail } from '../../lib/email';

const SALT_ROUNDS = 12;

function sanitizeUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signAccessToken(user: { id: string; email: string; role: UserRole }) {
  const secret = process.env.JWT_ACCESS_SECRET!;
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '15m' }
  );
}

async function createRefreshToken(userId: string) {
  const raw = generateSecureToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return raw;
}

export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: UserRole.USER,
      emailVerified: false,
    },
  });

  const otpResult = await createAndSendOtp(user.id, user.email);

  return {
    requiresVerification: true,
    email: user.email,
    message: otpResult.sent
      ? 'Verification code sent to your email.'
      : 'Verification code generated. Check the server console (SMTP not configured yet).',
    devMode: otpResult.devMode,
  };
}

export async function verifyEmailOtp(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    throw new ValidationError([{ field: 'email', message: 'Account not found' }]);
  }
  if (user.emailVerified) {
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    return { user: sanitizeUser(user), accessToken, refreshToken };
  }

  const codeHash = hashOtpCode(code);
  const record = await prisma.emailOtp.findFirst({
    where: {
      userId: user.id,
      codeHash,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new ValidationError([{ field: 'code', message: 'Invalid or expired verification code' }]);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
    prisma.emailOtp.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const accessToken = signAccessToken(verified);
  const refreshToken = await createRefreshToken(verified.id);

  return {
    user: sanitizeUser(verified),
    accessToken,
    refreshToken,
  };
}

export async function resendEmailOtp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    return { message: 'If an account exists, a new code has been sent.' };
  }
  if (user.emailVerified) {
    return { message: 'Email is already verified. You can sign in.' };
  }

  const otpResult = await createAndSendOtp(user.id, user.email);
  return {
    message: otpResult.sent
      ? 'A new verification code was sent to your email.'
      : 'New code generated. Check the server console (SMTP not configured).',
    devMode: otpResult.devMode,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (!user.emailVerified) {
    throw new UnauthorizedError(
      'Email not verified. Enter the OTP sent to your email or request a new code.'
    );
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  let devMode = false;

  if (user) {
    const raw = generateSecureToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const baseUrl = (process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password').replace(
      /\?.*$/,
      ''
    );
    const resetUrl = `${baseUrl}?token=${encodeURIComponent(raw)}`;
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
    devMode = emailResult.devMode;
  }

  return {
    message: devMode
      ? 'If an account exists with this email, a reset link was generated. SMTP is unavailable — check the backend terminal for the link.'
      : 'If an account exists with this email, a password reset link has been sent.',
    devMode,
  };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!record) throw new ValidationError([{ field: 'token', message: 'Invalid or expired reset token' }]);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { message: 'Password reset successfully' };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return sanitizeUser(user);
}
