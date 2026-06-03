import { registerSchema, loginSchema } from '../src/validators/auth';
import { createExtinguisherSchema } from '../src/validators/extinguisher';
import { scheduleInspectionSchema } from '../src/validators/inspection';
import { createMaintenanceSchema } from '../src/validators/maintenance';
import { changePasswordSchema } from '../src/validators/user';

describe('Validation schemas (no DB)', () => {
  describe('Auth', () => {
    it('rejects weak password on register', () => {
      const r = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'j@example.com',
        password: 'weak',
      });
      expect(r.success).toBe(false);
    });

    it('accepts valid register', () => {
      const r = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'j@example.com',
        password: 'Password1',
      });
      expect(r.success).toBe(true);
    });

    it('rejects invalid email on login', () => {
      const r = loginSchema.safeParse({ email: 'bad', password: 'x' });
      expect(r.success).toBe(false);
    });
  });

  describe('Extinguisher', () => {
    it('rejects installation date in the future', () => {
      const r = createExtinguisherSchema.safeParse({
        serialNumber: 'SN-2',
        location: 'Floor 1',
        type: 'CO2',
        size: 'LB_5',
        installationDate: '2099-01-01',
        expiryDate: '2099-06-01',
      });
      expect(r.success).toBe(false);
    });

    it('rejects expiry before installation', () => {
      const r = createExtinguisherSchema.safeParse({
        serialNumber: 'SN-1',
        location: 'Floor 1',
        type: 'CO2',
        size: 'LB_5',
        installationDate: '2025-01-01',
        expiryDate: '2024-01-01',
      });
      expect(r.success).toBe(false);
    });

    it('accepts valid extinguisher', () => {
      const r = createExtinguisherSchema.safeParse({
        serialNumber: 'SN-1',
        location: 'Floor 1',
        type: 'WATER',
        size: 'LB_9',
        installationDate: '2024-01-01',
        expiryDate: '2026-01-01',
        status: 'ACTIVE',
      });
      expect(r.success).toBe(true);
    });

    it('rejects invalid type enum', () => {
      const r = createExtinguisherSchema.safeParse({
        serialNumber: 'SN-1',
        location: 'Floor 1',
        type: 'INVALID',
        size: 'LB_5',
        installationDate: '2024-01-01',
        expiryDate: '2026-01-01',
      });
      expect(r.success).toBe(false);
    });
  });

  describe('Inspection', () => {
    it('rejects past scheduled date', () => {
      const r = scheduleInspectionSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        scheduledDate: '2020-01-01',
        scheduledTime: '10:00',
      });
      expect(r.success).toBe(false);
    });

    it('rejects invalid time format', () => {
      const r = scheduleInspectionSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        scheduledDate: '2026-12-01',
        scheduledTime: '25:99',
      });
      expect(r.success).toBe(false);
    });

    it('accepts valid schedule', () => {
      const r = scheduleInspectionSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        scheduledDate: '2026-12-01',
        scheduledTime: '14:30',
      });
      expect(r.success).toBe(true);
    });
  });

  describe('Maintenance', () => {
    it('requires all fields', () => {
      const r = createMaintenanceSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        actionTaken: '',
        maintenanceDate: '2024-01-01',
        issuesIdentified: 'None',
        notes: 'OK',
      });
      expect(r.success).toBe(false);
    });

    it('rejects future maintenance date', () => {
      const r = createMaintenanceSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        actionTaken: 'Recharged',
        maintenanceDate: '2099-06-01',
        issuesIdentified: 'Low pressure',
        notes: 'OK',
      });
      expect(r.success).toBe(false);
    });

    it('rejects invalid year 0001', () => {
      const r = createMaintenanceSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        actionTaken: 'Checked',
        maintenanceDate: '0001-01-01',
        issuesIdentified: 'None',
        notes: 'OK',
      });
      expect(r.success).toBe(false);
    });

    it('accepts past maintenance date', () => {
      const r = createMaintenanceSchema.safeParse({
        extinguisherId: '00000000-0000-0000-0000-000000000001',
        actionTaken: 'Recharged',
        maintenanceDate: '2024-06-15',
        issuesIdentified: 'Low pressure',
        notes: 'OK',
      });
      expect(r.success).toBe(true);
    });
  });

  describe('Password change', () => {
    it('enforces password rules on new password', () => {
      const r = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'short',
      });
      expect(r.success).toBe(false);
    });
  });
});
