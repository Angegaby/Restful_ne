import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { validatePastOrToday } from '../../lib/dates';
import { maintenanceWhere } from '../../lib/scope';
import * as extinguishersService from '../extinguishers/extinguishers.service';
import { paginatedResult, skipTake } from '../../lib/pagination';

function formatLog(m: {
  id: string;
  extinguisherId: string;
  inspectorId: string;
  actionTaken: string;
  maintenanceDate: Date;
  issuesIdentified: string;
  notes: string;
  createdAt: Date;
  extinguisher?: { serialNumber: string; location: string };
  inspector?: { firstName: string; lastName: string };
}) {
  return {
    ...m,
    maintenanceDate: m.maintenanceDate.toISOString().split('T')[0],
  };
}

export async function create(
  inspectorId: string,
  role: UserRole,
  data: {
    extinguisherId: string;
    actionTaken: string;
    maintenanceDate: string;
    issuesIdentified: string;
    notes: string;
  }
) {
  if (role === UserRole.INSPECTOR) {
    await extinguishersService.assertInspectorCanAccess(data.extinguisherId, inspectorId);
  }

  const extinguisher = await prisma.fireExtinguisher.findUnique({
    where: { id: data.extinguisherId },
  });
  if (!extinguisher) throw new NotFoundError('Fire extinguisher not found');

  const dateCheck = validatePastOrToday(data.maintenanceDate);
  if (!dateCheck.ok) {
    throw new ValidationError([{ field: 'maintenanceDate', message: dateCheck.message }]);
  }

  const log = await prisma.maintenanceLog.create({
    data: {
      extinguisherId: data.extinguisherId,
      inspectorId,
      actionTaken: data.actionTaken,
      maintenanceDate: dateCheck.date,
      issuesIdentified: data.issuesIdentified,
      notes: data.notes,
    },
    include: {
      extinguisher: { select: { serialNumber: true, location: true } },
      inspector: { select: { firstName: true, lastName: true } },
    },
  });
  return formatLog(log);
}

export async function list(
  userId: string,
  role: UserRole,
  page: number,
  limit: number
) {
  const where = maintenanceWhere(userId, role);
  const [total, logs] = await Promise.all([
    prisma.maintenanceLog.count({ where }),
    prisma.maintenanceLog.findMany({
      where,
      include: {
        extinguisher: { select: { serialNumber: true, location: true } },
        inspector: { select: { firstName: true, lastName: true } },
      },
      orderBy: { maintenanceDate: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);
  return paginatedResult(logs.map(formatLog), total, page, limit);
}

export async function getById(id: string, userId: string, role: UserRole) {
  const log = await prisma.maintenanceLog.findFirst({
    where: { id, ...maintenanceWhere(userId, role) },
    include: {
      extinguisher: { select: { serialNumber: true, location: true } },
      inspector: { select: { firstName: true, lastName: true } },
    },
  });
  if (!log) throw new NotFoundError('Maintenance log not found');
  return formatLog(log);
}
