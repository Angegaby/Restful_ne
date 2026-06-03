import 'dotenv/config';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: ['test@example.com', 'block@example.com'] } },
  });
  await prisma.$disconnect();
});

describe('Auth API', () => {
  it('POST /api/auth/register - validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'A',
      lastName: 'B',
      email: 'bad-email',
      password: 'weak',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register - creates user and requires OTP', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresVerification).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('POST /api/auth/verify-otp - verifies and returns tokens', async () => {
    const { hashOtpCode } = await import('../src/lib/otp');
    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    await prisma.emailOtp.updateMany({ where: { userId: user!.id }, data: { used: true } });
    await prisma.emailOtp.create({
      data: {
        userId: user!.id,
        codeHash: hashOtpCode('123456'),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'test@example.com',
      code: '123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/auth/login - blocked until email verified', async () => {
    await request(app).post('/api/auth/register').send({
      firstName: 'Block',
      lastName: 'Test',
      email: 'block@example.com',
      password: 'Password1',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'block@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/register - rejects duplicate', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login - success', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/auth/login - invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - requires token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password1',
    });
    const token = login.body.data.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });
});
