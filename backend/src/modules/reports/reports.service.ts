import { ExtinguisherStatus, InspectionStatus, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { extinguisherWhere, inspectionWhere, maintenanceWhere } from '../../lib/scope';
import * as inspectionsService from '../inspections/inspections.service';
import { paginationMeta, skipTake } from '../../lib/pagination';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function inventoryReport(userId: string, role: UserRole) {
  const extWhere = extinguisherWhere(userId, role);
  const total = await prisma.fireExtinguisher.count({ where: extWhere });
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = endOfDay(new Date(now.getFullYear(), 11, 31));

  const [daily, monthly, yearly] = await Promise.all([
    prisma.fireExtinguisher.count({
      where: { ...extWhere, createdAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.fireExtinguisher.count({
      where: { ...extWhere, createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.fireExtinguisher.count({
      where: { ...extWhere, createdAt: { gte: yearStart, lte: yearEnd } },
    }),
  ]);

  const byStatus = await prisma.fireExtinguisher.groupBy({
    by: ['status'],
    where: extWhere,
    _count: { id: true },
  });

  const byType = await prisma.fireExtinguisher.groupBy({
    by: ['type'],
    where: extWhere,
    _count: { id: true },
  });

  const items = await prisma.fireExtinguisher.findMany({
    where: extWhere,
    orderBy: { serialNumber: 'asc' },
    select: {
      id: true,
      serialNumber: true,
      location: true,
      type: true,
      status: true,
      expiryDate: true,
      assignedInspector: { select: { firstName: true, lastName: true } },
    },
    take: role === UserRole.USER ? 50 : 200,
  });

  return {
    total,
    dailySummary: daily,
    monthlySummary: monthly,
    yearlySummary: yearly,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
    items: items.map((e) => ({
      id: e.id,
      serialNumber: e.serialNumber,
      location: e.location,
      type: e.type,
      status: e.status,
      expiryDate: e.expiryDate.toISOString().split('T')[0],
      inspector: e.assignedInspector
        ? `${e.assignedInspector.firstName} ${e.assignedInspector.lastName}`
        : 'Unassigned',
    })),
    scope: role === UserRole.INSPECTOR ? 'assigned' : role === UserRole.USER ? 'all' : 'organization',
    generatedAt: now.toISOString(),
  };
}

export async function inspectionReport(userId: string, role: UserRole) {
  await inspectionsService.syncOverdueStatuses();

  const scope = inspectionWhere(userId, role);

  const [pending, completed, overdue, total] = await Promise.all([
    prisma.inspection.count({ where: { ...scope, status: InspectionStatus.PENDING } }),
    prisma.inspection.count({ where: { ...scope, status: InspectionStatus.COMPLETED } }),
    prisma.inspection.count({ where: { ...scope, status: InspectionStatus.OVERDUE } }),
    prisma.inspection.count({ where: scope }),
  ]);

  const recent = await prisma.inspection.findMany({
    where: scope,
    take: 500,
    orderBy: { scheduledDate: 'desc' },
    include: {
      extinguisher: { select: { serialNumber: true, location: true } },
      scheduledBy: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    pending,
    completed,
    overdue,
    total,
    recent: recent.map((i) => ({
      id: i.id,
      serialNumber: i.extinguisher.serialNumber,
      location: i.extinguisher.location,
      scheduledDate: i.scheduledDate.toISOString().split('T')[0],
      scheduledTime: i.scheduledTime,
      status: i.status,
      requestedBy: `${i.scheduledBy.firstName} ${i.scheduledBy.lastName}`,
    })),
    scope:
      role === UserRole.USER
        ? 'my_requests'
        : role === UserRole.INSPECTOR
          ? 'assigned_extinguishers'
          : 'organization',
    generatedAt: new Date().toISOString(),
  };
}

export async function complianceReport(userId: string, role: UserRole) {
  const today = startOfDay(new Date());
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const extWhere = extinguisherWhere(userId, role);
  const total = await prisma.fireExtinguisher.count({ where: extWhere });

  const expired = await prisma.fireExtinguisher.findMany({
    where: {
      ...extWhere,
      OR: [
        { status: ExtinguisherStatus.EXPIRED },
        { expiryDate: { lt: today } },
      ],
    },
    orderBy: { expiryDate: 'asc' },
    take: role === UserRole.USER ? 10 : 100,
  });

  const upcoming = await prisma.fireExtinguisher.findMany({
    where: {
      ...extWhere,
      expiryDate: { gte: today, lte: in30Days },
      status: { not: ExtinguisherStatus.DECOMMISSIONED },
    },
    orderBy: { expiryDate: 'asc' },
    take: role === UserRole.USER ? 10 : 100,
  });

  const activeCompliant = await prisma.fireExtinguisher.count({
    where: {
      ...extWhere,
      expiryDate: { gte: today },
      status: ExtinguisherStatus.ACTIVE,
    },
  });

  const compliancePercent =
    total > 0 ? Math.round((activeCompliant / total) * 100) : 100;

  return {
    total,
    expiredCount: expired.length,
    upcomingExpirationsCount: upcoming.length,
    compliancePercent,
    complianceStatus:
      compliancePercent >= 90
        ? 'COMPLIANT'
        : compliancePercent >= 70
          ? 'AT_RISK'
          : 'NON_COMPLIANT',
    expired: expired.map((e) => ({
      id: e.id,
      serialNumber: e.serialNumber,
      location: e.location,
      expiryDate: e.expiryDate.toISOString().split('T')[0],
      status: e.status,
    })),
    upcomingExpirations: upcoming.map((e) => ({
      id: e.id,
      serialNumber: e.serialNumber,
      location: e.location,
      expiryDate: e.expiryDate.toISOString().split('T')[0],
      status: e.status,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export async function maintenanceReport(
  userId: string,
  role: UserRole,
  page = 1,
  limit = 20
) {
  const scope = maintenanceWhere(userId, role);
  const total = await prisma.maintenanceLog.count({ where: scope });

  const recent = await prisma.maintenanceLog.findMany({
    where: scope,
    take: 10,
    orderBy: { maintenanceDate: 'desc' },
    include: {
      extinguisher: { select: { serialNumber: true, location: true } },
      inspector: { select: { firstName: true, lastName: true } },
    },
  });

  const frequency = await prisma.maintenanceLog.groupBy({
    by: ['extinguisherId'],
    where: scope,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const extinguisherIds = frequency.map((f) => f.extinguisherId);
  const extinguishers = await prisma.fireExtinguisher.findMany({
    where: { id: { in: extinguisherIds } },
    select: { id: true, serialNumber: true },
  });
  const extMap = Object.fromEntries(extinguishers.map((e) => [e.id, e.serialNumber]));

  const history = await prisma.maintenanceLog.findMany({
    where: scope,
    orderBy: { maintenanceDate: 'desc' },
    ...skipTake(page, limit),
    include: {
      extinguisher: { select: { serialNumber: true, location: true } },
      inspector: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    totalLogs: total,
    historyPagination: paginationMeta(total, page, limit),
    maintenanceFrequency: frequency.map((f) => ({
      extinguisherId: f.extinguisherId,
      serialNumber: extMap[f.extinguisherId] ?? 'Unknown',
      count: f._count.id,
    })),
    recentActivities: recent.map((m) => ({
      id: m.id,
      serialNumber: m.extinguisher.serialNumber,
      location: m.extinguisher.location,
      actionTaken: m.actionTaken,
      maintenanceDate: m.maintenanceDate.toISOString().split('T')[0],
      inspector: `${m.inspector.firstName} ${m.inspector.lastName}`,
    })),
    maintenanceHistory: history.map((m) => ({
      id: m.id,
      serialNumber: m.extinguisher.serialNumber,
      location: m.extinguisher.location,
      actionTaken: m.actionTaken,
      maintenanceDate: m.maintenanceDate.toISOString().split('T')[0],
      issuesIdentified: m.issuesIdentified,
      notes: m.notes,
      inspector: `${m.inspector.firstName} ${m.inspector.lastName}`,
    })),
    scope:
      role === UserRole.INSPECTOR
        ? 'assigned_extinguishers'
        : role === UserRole.USER
          ? 'related_to_my_requests'
          : 'organization',
    generatedAt: new Date().toISOString(),
  };
}

/** Full report bundle: stock totals, inspection status, expired units, maintenance history */
export async function comprehensiveReport(
  userId: string,
  role: UserRole,
  maintenancePage = 1,
  maintenanceLimit = 20
) {
  await inspectionsService.syncOverdueStatuses();

  const [inventory, inspections, compliance, maintenance] = await Promise.all([
    inventoryReport(userId, role),
    inspectionReport(userId, role),
    complianceReport(userId, role),
    maintenanceReport(userId, role, maintenancePage, maintenanceLimit),
  ]);

  return buildComprehensivePayload(inventory, inspections, compliance, maintenance);
}

/** Full dataset for PDF/CSV export (all maintenance logs) */
export async function comprehensiveReportForExport(userId: string, role: UserRole) {
  await inspectionsService.syncOverdueStatuses();

  const [inventory, inspections, compliance, maintenance] = await Promise.all([
    inventoryReport(userId, role),
    inspectionReport(userId, role),
    complianceReport(userId, role),
    maintenanceReport(userId, role, 1, 5000),
  ]);

  return buildComprehensivePayload(inventory, inspections, compliance, maintenance);
}

function buildComprehensivePayload(
  inventory: Awaited<ReturnType<typeof inventoryReport>>,
  inspections: Awaited<ReturnType<typeof inspectionReport>>,
  compliance: Awaited<ReturnType<typeof complianceReport>>,
  maintenance: Awaited<ReturnType<typeof maintenanceReport>>
) {

  return {
    stock: {
      totalInStock: inventory.total,
      dailyAdded: inventory.dailySummary,
      monthlyAdded: inventory.monthlySummary,
      yearlyAdded: inventory.yearlySummary,
      byStatus: inventory.byStatus,
      byType: inventory.byType,
    },
    inspectionStatus: {
      pending: inspections.pending,
      overdue: inspections.overdue,
      completed: inspections.completed,
      total: inspections.total,
      recent: inspections.recent,
    },
    expiredExtinguishers: compliance.expired,
    expiredCount: compliance.expiredCount,
    upcomingExpirations: compliance.upcomingExpirations,
    upcomingExpirationsCount: compliance.upcomingExpirationsCount,
    compliancePercent: compliance.compliancePercent,
    complianceStatus: compliance.complianceStatus,
    maintenanceHistory: maintenance.maintenanceHistory,
    maintenanceTotalLogs: maintenance.totalLogs,
    maintenanceHistoryPagination: maintenance.historyPagination,
    generatedAt: new Date().toISOString(),
  };
}

/** Role-scoped stats for dashboard — matches what the user sees on Inspections page */
export async function dashboardStats(userId: string, role: UserRole) {
  await inspectionsService.syncOverdueStatuses();

  const inspScope = inspectionWhere(userId, role);
  const extWhere = extinguisherWhere(userId, role);

  const [pending, overdue, completed, totalInspections] = await Promise.all([
    prisma.inspection.count({ where: { ...inspScope, status: InspectionStatus.PENDING } }),
    prisma.inspection.count({ where: { ...inspScope, status: InspectionStatus.OVERDUE } }),
    prisma.inspection.count({ where: { ...inspScope, status: InspectionStatus.COMPLETED } }),
    prisma.inspection.count({ where: inspScope }),
  ]);

  const totalExtinguishers = await prisma.fireExtinguisher.count({ where: extWhere });

  const byStatus = await prisma.fireExtinguisher.groupBy({
    by: ['status'],
    where: extWhere,
    _count: { id: true },
  });

  const byType = await prisma.fireExtinguisher.groupBy({
    by: ['type'],
    where: extWhere,
    _count: { id: true },
  });

  const compliance = await complianceReport(userId, role);

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    MAINTENANCE: 'Maintenance',
    DECOMMISSIONED: 'Decommissioned',
  };

  const typeLabels: Record<string, string> = {
    WATER: 'Water',
    CO2: 'CO₂',
    FOAM: 'Foam',
    DRY_CHEMICAL: 'Dry Chemical',
  };

  return {
    extinguishers: { total: totalExtinguishers },
    inspections: {
      pending,
      overdue,
      completed,
      total: totalInspections,
    },
    compliance: {
      percent: compliance.compliancePercent,
      expired: compliance.expiredCount,
      upcoming: compliance.upcomingExpirationsCount,
      status: compliance.complianceStatus,
    },
    charts: {
      inspectionStatus: [
        { label: 'Pending', value: pending, color: '#ca8a04' },
        { label: 'Overdue', value: overdue, color: '#dc2626' },
        { label: 'Completed', value: completed, color: '#16a34a' },
      ],
      extinguisherStatus: byStatus.map((s) => ({
        label: statusLabels[s.status] || s.status,
        value: s._count.id,
        color:
          s.status === 'ACTIVE'
            ? '#16a34a'
            : s.status === 'EXPIRED'
              ? '#dc2626'
              : s.status === 'MAINTENANCE'
                ? '#ca8a04'
                : '#64748b',
      })),
      extinguisherByType: byType.map((t) => ({
        label: typeLabels[t.type] || t.type,
        value: t._count.id,
        color: '#dc2626',
      })),
    },
    generatedAt: new Date().toISOString(),
  };
}
