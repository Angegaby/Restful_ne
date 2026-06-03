import { Prisma, UserRole } from '@prisma/client';

/** Extinguishers visible to role: inspector sees only assigned; admin/user see all */
export function extinguisherWhere(userId: string, role: UserRole): Prisma.FireExtinguisherWhereInput {
  if (role === UserRole.INSPECTOR) {
    return { assignedInspectorId: userId };
  }
  return {};
}

/** Inspections visible to role */
export function inspectionWhere(userId: string, role: UserRole): Prisma.InspectionWhereInput {
  if (role === UserRole.USER) {
    return { scheduledById: userId };
  }
  if (role === UserRole.INSPECTOR) {
    return { extinguisher: { assignedInspectorId: userId } };
  }
  return {};
}

/** Maintenance logs visible to role */
export function maintenanceWhere(userId: string, role: UserRole): Prisma.MaintenanceLogWhereInput {
  if (role === UserRole.INSPECTOR) {
    return { extinguisher: { assignedInspectorId: userId } };
  }
  if (role === UserRole.USER) {
    return { extinguisher: { inspections: { some: { scheduledById: userId } } } };
  }
  return {};
}
