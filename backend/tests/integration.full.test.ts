/**
 * Full API integration tests — requires PostgreSQL + seed data.
 * Set DATABASE_URL in .env before running: npm test
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

const ADMIN = { email: 'angegaby200@gmail.com', password: 'Hello@2026' };
const INSPECTOR = { email: 'test-inspector@fems.com', password: 'Password1' };
const USER = { email: 'test-user@fems.com', password: 'Password1' };

async function login(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data?.accessToken as string;
}

describe('FEMS Full Integration', () => {
  let adminToken: string;
  let inspectorToken: string;
  let userToken: string;
  let extinguisherId: string;
  let inspectionId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
    } catch (e) {
      throw new Error(
        'PostgreSQL connection failed. Update DATABASE_URL in backend/.env with your postgres password, then run: npx prisma db push && npm run db:seed'
      );
    }
    adminToken = await login(ADMIN.email, ADMIN.password);
    if (!adminToken) {
      throw new Error('Login failed. Run: npm run db:seed (requires seeded admin user)');
    }

    const inspectorHash = await bcrypt.hash(INSPECTOR.password, 12);
    const userHash = await bcrypt.hash(USER.password, 12);
    await prisma.user.upsert({
      where: { email: INSPECTOR.email },
      update: { emailVerified: true, role: 'INSPECTOR', passwordHash: inspectorHash },
      create: {
        firstName: 'Test',
        lastName: 'Inspector',
        email: INSPECTOR.email,
        passwordHash: inspectorHash,
        role: 'INSPECTOR',
        emailVerified: true,
      },
    });
    await prisma.user.upsert({
      where: { email: USER.email },
      update: { emailVerified: true, role: 'USER', passwordHash: userHash },
      create: {
        firstName: 'Test',
        lastName: 'User',
        email: USER.email,
        passwordHash: userHash,
        role: 'USER',
        emailVerified: true,
      },
    });

    inspectorToken = await login(INSPECTOR.email, INSPECTOR.password);
    userToken = await login(USER.email, USER.password);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Activity 2 — Auth & Users', () => {
    it('GET /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('GET /api/auth/me with token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('GET /api/users/me', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(USER.email);
    });

    it('POST /api/auth/register validation 422', async () => {
      const res = await request(app).post('/api/auth/register').send({
        firstName: 'A',
        lastName: 'B',
        email: 'not-email',
        password: 'weak',
      });
      expect(res.status).toBe(422);
    });

    it('USER cannot access admin users list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('ADMIN can list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/auth/forgot-password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: USER.email });
      expect(res.status).toBe(200);
    });
  });

  describe('Activity 3 — Extinguishers', () => {
    it('GET /api/extinguishers — all roles', async () => {
      const res = await request(app)
        .get('/api/extinguishers')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      extinguisherId = res.body.data[0].id;
    });

    it('GET /api/extinguishers/:id', async () => {
      const res = await request(app)
        .get(`/api/extinguishers/${extinguisherId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.serialNumber).toBeDefined();
    });

    it('USER cannot POST extinguisher', async () => {
      const res = await request(app)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          serialNumber: 'TEST-USER-FAIL',
          location: 'X',
          type: 'CO2',
          size: 'LB_5',
          installationDate: '2024-01-01',
          expiryDate: '2026-01-01',
        });
      expect(res.status).toBe(403);
    });

    it('ADMIN can create extinguisher', async () => {
      const serial = `TEST-${Date.now()}`;
      const res = await request(app)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serialNumber: serial,
          location: 'Test Lab',
          type: 'FOAM',
          size: 'LB_9',
          installationDate: '2024-06-01',
          expiryDate: '2027-06-01',
          status: 'ACTIVE',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.serialNumber).toBe(serial);
    });

    it('duplicate serial returns 409', async () => {
      const res = await request(app)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serialNumber: 'FE-001-2024',
          location: 'Dup',
          type: 'CO2',
          size: 'LB_5',
          installationDate: '2024-01-01',
          expiryDate: '2026-01-01',
        });
      expect(res.status).toBe(409);
    });
  });

  describe('Activity 3 — Inspections & Notifications', () => {
    it('USER can schedule inspection', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      const date = future.toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          extinguisherId,
          scheduledDate: date,
          scheduledTime: '09:00',
          notes: 'Integration test',
        });
      expect(res.status).toBe(201);
      inspectionId = res.body.data.id;
    });

    it('INSPECTOR cannot schedule inspection', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const date = future.toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          extinguisherId,
          scheduledDate: date,
          scheduledTime: '10:00',
        });
      expect(res.status).toBe(403);
    });

    it('past date rejected 422', async () => {
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          extinguisherId,
          scheduledDate: '2020-01-01',
          scheduledTime: '09:00',
        });
      expect(res.status).toBe(422);
    });

    it('GET /api/inspections', async () => {
      const res = await request(app)
        .get('/api/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /api/notifications for inspector', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(res.status).toBe(200);
    });

    it('INSPECTOR can complete inspection', async () => {
      const res = await request(app)
        .patch(`/api/inspections/${inspectionId}/complete`)
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({ status: 'COMPLETED', notes: 'Done' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Activity 3 — Maintenance', () => {
    it('USER cannot log maintenance', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          extinguisherId,
          actionTaken: 'Test',
          maintenanceDate: '2025-01-01',
          issuesIdentified: 'None',
          notes: 'Notes',
        });
      expect(res.status).toBe(403);
    });

    it('INSPECTOR can log maintenance', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          extinguisherId,
          actionTaken: 'Recharged unit',
          maintenanceDate: '2025-12-01',
          issuesIdentified: 'Low pressure',
          notes: 'Recommend annual check',
        });
      expect(res.status).toBe(201);
    });
  });

  describe('Activity 4 — Reports', () => {
    it('GET inventory report', async () => {
      const res = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeGreaterThanOrEqual(0);
      expect(res.body.data).toHaveProperty('dailySummary');
      expect(res.body.data).toHaveProperty('monthlySummary');
      expect(res.body.data).toHaveProperty('yearlySummary');
    });

    it('GET inspections report', async () => {
      const res = await request(app)
        .get('/api/reports/inspections')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('completed');
      expect(res.body.data).toHaveProperty('overdue');
    });

    it('GET compliance report', async () => {
      const res = await request(app)
        .get('/api/reports/compliance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('complianceStatus');
      expect(res.body.data).toHaveProperty('expired');
      expect(res.body.data).toHaveProperty('upcomingExpirations');
    });

    it('GET maintenance report', async () => {
      const res = await request(app)
        .get('/api/reports/maintenance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('maintenanceHistory');
      expect(res.body.data).toHaveProperty('maintenanceFrequency');
      expect(res.body.data).toHaveProperty('recentActivities');
    });

    it('Export CSV inventory', async () => {
      const res = await request(app)
        .get('/api/reports/inventory/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/csv|text/);
    });

    it('Export PDF compliance', async () => {
      const res = await request(app)
        .get('/api/reports/compliance/export?format=pdf')
        .set('Authorization', `Bearer ${inspectorToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });

    it('USER cannot export reports', async () => {
      const res = await request(app)
        .get('/api/reports/inventory/export?format=pdf')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Swagger', () => {
    it('GET /api/docs.json', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
    });
  });
});
