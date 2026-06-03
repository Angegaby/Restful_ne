import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { paginatedResult, skipTake } from '../../lib/pagination';

export async function notifyUser(userId: string, message: string) {
  await prisma.notification.create({
    data: { userId, message },
  });
}

export async function notifyPersonnel(message: string, roles: UserRole[] = [UserRole.ADMIN, UserRole.INSPECTOR]) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, message })),
  });
}

export async function listForUser(
  userId: string,
  unreadOnly: boolean,
  page: number,
  limit: number
) {
  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  };
  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);
  return paginatedResult(items, total, page, limit);
}

export async function markRead(id: string, userId: string) {
  const n = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!n) throw new NotFoundError('Notification not found');
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}
