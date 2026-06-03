import crypto from 'crypto';
import { prisma } from './prisma';
import { sendOtpEmail } from './email';

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createAndSendOtp(userId: string, email: string) {
  await prisma.emailOtp.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.emailOtp.create({
    data: { userId, codeHash, expiresAt },
  });

  const result = await sendOtpEmail(email, code);
  return { ...result, expiresAt };
}
