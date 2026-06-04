import { InspectionStatus, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';
import { validateTodayOrFuture } from '../../lib/dates';
import { inspectionWhere } from '../../lib/scope';
import * as notifications from '../notifications/notifications.service';
import * as extinguishersService from '../extinguishers/extinguishers.service';
import { assertInspectorId } from '../users/users.service';
import { paginatedResult, skipTake } from '../../lib/pagination';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function syncOverdueStatuses() {
  const today = startOfToday();
  await prisma.inspection.updateMany({
    where: {
      status: InspectionStatus.PENDING,
      scheduledDate: { lt: today },
    },
    data: { status: InspectionStatus.OVERDUE },
  });
}

function formatInspection(i: {
  id: string;
  extinguisherId: string;
  scheduledById: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: InspectionStatus;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  extinguisher?: {
    serialNumber: string;
    location: string;
    assignedInspectorId?: string | null;
  };
  scheduledBy?: { firstName: string; lastName: string; email: string };
}) {
  return {
    ...i,
    scheduledDate: i.scheduledDate.toISOString().split('T')[0],
    completedAt: i.completedAt?.toISOString() ?? null,
  };
}

export async function schedule(
  userId: string,
  data: {
    extinguisherId: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
  }
) {
  const extinguisher = await prisma.fireExtinguisher.findUnique({
    where: { id: data.extinguisherId },
    include: { assignedInspector: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!extinguisher) throw new NotFoundError('Fire extinguisher not found');

  const dateCheck = validateTodayOrFuture(data.scheduledDate);
  if (!dateCheck.ok) {
    throw new ValidationError([{ field: 'scheduledDate', message: dateCheck.message }]);
  }
  const scheduled = dateCheck.date;

  const inspection = await prisma.inspection.create({
    data: {
      extinguisherId: data.extinguisherId,
      scheduledById: userId,
      scheduledDate: scheduled,
      scheduledTime: data.scheduledTime,
      notes: data.notes,
      status: InspectionStatus.PENDING,
    },
    include: {
      extinguisher: {
        select: { serialNumber: true, location: true, assignedInspectorId: true },
      },
      scheduledBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const scheduleSummary = `${extinguisher.serialNumber} at ${extinguisher.location} on ${data.scheduledDate} at ${data.scheduledTime}`;

  await notifications.notifyPersonnel(
    `New inspection request: ${scheduleSummary}. Assign an inspector from Inspections or Extinguishers.`,
    [UserRole.ADMIN]
  );

  if (extinguisher.assignedInspectorId) {
    await notifications.notifyUser(
      extinguisher.assignedInspectorId,
      `Inspection requested for ${scheduleSummary}.`
    );
  }

  await notifications.notifyUser(
    userId,
    `Your inspection request for ${extinguisher.serialNumber} was submitted successfully.`
  );

  return formatInspection(inspection);
}

export async function list(
  userId: string,
  role: UserRole,
  page: number,
  limit: number
) {
  await syncOverdueStatuses();

  const where = inspectionWhere(userId, role);
  const [total, items] = await Promise.all([
    prisma.inspection.count({ where }),
    prisma.inspection.findMany({
      where,
      include: {
        extinguisher: {
          select: { serialNumber: true, location: true, assignedInspectorId: true },
        },
        scheduledBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { scheduledDate: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);
  return paginatedResult(items.map(formatInspection), total, page, limit);
}

export async function assignInspector(inspectionId: string, assignedInspectorId: string) {
  await syncOverdueStatuses();

  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      extinguisher: {
        select: { id: true, serialNumber: true, location: true, assignedInspectorId: true },
      },
      scheduledBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!inspection) throw new NotFoundError('Inspection not found');

  await assertInspectorId(assignedInspectorId);

  const inspector = await prisma.user.findUnique({
    where: { id: assignedInspectorId },
    select: { firstName: true, lastName: true },
  });
  if (!inspector) throw new NotFoundError('Inspector not found');

  await prisma.fireExtinguisher.update({
    where: { id: inspection.extinguisherId },
    data: { assignedInspectorId },
  });

  const dateStr = inspection.scheduledDate.toISOString().split('T')[0];
  const assignMsg = `You have been assigned to ${inspection.extinguisher.serialNumber} at ${inspection.extinguisher.location}. Inspection on ${dateStr} at ${inspection.scheduledTime}.`;

  await notifications.notifyUser(assignedInspectorId, assignMsg);

  await notifications.notifyUser(
    inspection.scheduledById,
    `Inspector ${inspector.firstName} ${inspector.lastName} was assigned for your inspection on ${inspection.extinguisher.serialNumber} (${dateStr} ${inspection.scheduledTime}).`
  );

  const updated = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      extinguisher: {
        select: { serialNumber: true, location: true, assignedInspectorId: true },
      },
      scheduledBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return formatInspection(updated!);
}

export async function complete(
  id: string,
  userId: string,
  role: UserRole,
  notes?: string
) {
  await syncOverdueStatuses();
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: { extinguisher: { select: { assignedInspectorId: true, serialNumber: true } } },
  });
  if (!inspection) throw new NotFoundError('Inspection not found');

  if (role === UserRole.INSPECTOR) {
    await extinguishersService.assertInspectorCanAccess(
      inspection.extinguisherId,
      userId
    );
  }

  if (inspection.status === InspectionStatus.COMPLETED) {
    throw new ValidationError([
      { field: 'status', message: 'Inspection is already completed' },
    ]);
  }

  const updated = await prisma.inspection.update({
    where: { id },
    data: {
      status: InspectionStatus.COMPLETED,
      completedAt: new Date(),
      ...(notes !== undefined && { notes }),
    },
    include: {
      extinguisher: {
        select: { serialNumber: true, location: true, assignedInspectorId: true },
      },
      scheduledBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  await notifications.notifyPersonnel(
    `Inspection completed for ${inspection.extinguisher.serialNumber}`
  );

  return formatInspection(updated);
}

export async function getById(id: string, userId: string, role: UserRole) {
  await syncOverdueStatuses();
  const inspection = await prisma.inspection.findFirst({
    where: { id, ...inspectionWhere(userId, role) },
    include: {
      extinguisher: {
        select: { serialNumber: true, location: true, assignedInspectorId: true },
      },
      scheduledBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!inspection) throw new NotFoundError('Inspection not found');
  return formatInspection(inspection);
}
