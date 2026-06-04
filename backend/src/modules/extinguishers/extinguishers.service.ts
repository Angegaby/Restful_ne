import {
  ExtinguisherStatus,
  ExtinguisherSize,
  ExtinguisherType,
  UserRole,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../../lib/errors';
import { extinguisherWhere } from '../../lib/scope';
import { paginatedResult, skipTake } from '../../lib/pagination';
import { assertInspectorId } from '../users/users.service';
import * as notifications from '../notifications/notifications.service';

const inspectorSelect = {
  select: { id: true, firstName: true, lastName: true, email: true },
};

function formatExtinguisher(e: {
  id: string;
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: Date;
  expiryDate: Date;
  status: ExtinguisherStatus;
  assignedInspectorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedInspector?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}) {
  return {
    id: e.id,
    serialNumber: e.serialNumber,
    location: e.location,
    type: e.type,
    size: e.size,
    installationDate: e.installationDate.toISOString().split('T')[0],
    expiryDate: e.expiryDate.toISOString().split('T')[0],
    status: e.status,
    assignedInspectorId: e.assignedInspectorId,
    assignedInspector: e.assignedInspector ?? null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

const includeInspector = { assignedInspector: inspectorSelect };

export async function create(data: {
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  status?: ExtinguisherStatus;
  assignedInspectorId?: string | null;
}) {
  await assertInspectorId(data.assignedInspectorId ?? null);

  const existing = await prisma.fireExtinguisher.findUnique({
    where: { serialNumber: data.serialNumber },
  });
  if (existing) throw new ConflictError('Serial number already exists');

  const extinguisher = await prisma.fireExtinguisher.create({
    data: {
      serialNumber: data.serialNumber,
      location: data.location,
      type: data.type,
      size: data.size,
      installationDate: new Date(data.installationDate),
      expiryDate: new Date(data.expiryDate),
      status: data.status ?? ExtinguisherStatus.ACTIVE,
      assignedInspectorId: data.assignedInspectorId ?? null,
    },
    include: includeInspector,
  });
  return formatExtinguisher(extinguisher);
}

export async function findAll(
  userId: string,
  role: UserRole,
  page: number,
  limit: number
) {
  const where = extinguisherWhere(userId, role);
  const [total, items] = await Promise.all([
    prisma.fireExtinguisher.count({ where }),
    prisma.fireExtinguisher.findMany({
      where,
      include: includeInspector,
      orderBy: { createdAt: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);
  return paginatedResult(items.map(formatExtinguisher), total, page, limit);
}

export async function findById(id: string, userId: string, role: UserRole) {
  const item = await prisma.fireExtinguisher.findFirst({
    where: { id, ...extinguisherWhere(userId, role) },
    include: includeInspector,
  });
  if (!item) throw new NotFoundError('Fire extinguisher not found');
  return formatExtinguisher(item);
}

export async function update(
  id: string,
  data: Partial<{
    serialNumber: string;
    location: string;
    type: ExtinguisherType;
    size: ExtinguisherSize;
    installationDate: string;
    expiryDate: string;
    status: ExtinguisherStatus;
    assignedInspectorId: string | null;
  }>
) {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Fire extinguisher not found');

  if (data.assignedInspectorId !== undefined) {
    await assertInspectorId(data.assignedInspectorId);
  }

  if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
    const dup = await prisma.fireExtinguisher.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (dup) throw new ConflictError('Serial number already exists');
  }

  const item = await prisma.fireExtinguisher.update({
    where: { id },
    data: {
      ...(data.serialNumber && { serialNumber: data.serialNumber }),
      ...(data.location && { location: data.location }),
      ...(data.type && { type: data.type }),
      ...(data.size && { size: data.size }),
      ...(data.installationDate && {
        installationDate: new Date(data.installationDate),
      }),
      ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) }),
      ...(data.status && { status: data.status }),
      ...(data.assignedInspectorId !== undefined && {
        assignedInspectorId: data.assignedInspectorId,
      }),
    },
    include: includeInspector,
  });

  if (
    data.assignedInspectorId !== undefined &&
    data.assignedInspectorId &&
    data.assignedInspectorId !== existing.assignedInspectorId
  ) {
    await notifications.notifyUser(
      data.assignedInspectorId,
      `You have been assigned to ${item.serialNumber} at ${item.location}.`
    );
  }

  return formatExtinguisher(item);
}

export async function remove(id: string) {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Fire extinguisher not found');
  await prisma.fireExtinguisher.delete({ where: { id } });
  return { message: 'Fire extinguisher deleted successfully' };
}

export async function assertInspectorCanAccess(extinguisherId: string, inspectorId: string) {
  const ext = await prisma.fireExtinguisher.findUnique({
    where: { id: extinguisherId },
    select: { assignedInspectorId: true },
  });
  if (!ext) throw new NotFoundError('Fire extinguisher not found');
  if (ext.assignedInspectorId !== inspectorId) {
    throw new ForbiddenError('This extinguisher is not assigned to you');
  }
}
