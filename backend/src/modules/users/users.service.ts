import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { sendInviteEmail } from '../../lib/email';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../lib/errors';
import { paginatedResult, skipTake } from '../../lib/pagination';

const SALT_ROUNDS = 12;

/** Admin-created accounts that always receive credential invite emails */
const INVITE_EMAIL_ROLES: UserRole[] = [UserRole.USER, UserRole.INSPECTOR];

function roleReceivesInviteEmail(role: UserRole) {
  return INVITE_EMAIL_ROLES.includes(role);
}

function sanitizeUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string }
) {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), NOT: { id: userId } },
    });
    if (existing) throw new ConflictError('Email already in use');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email && { email: data.email.toLowerCase() }),
    },
  });
  return sanitizeUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  await prisma.refreshToken.deleteMany({ where: { userId } });

  return { message: 'Password changed successfully' };
}

export async function listUsers(page: number, limit: number) {
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      ...skipTake(page, limit),
    }),
  ]);
  return paginatedResult(users, total, page, limit);
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      emailVerified: true,
    },
  });

  const emailResult = await sendInviteEmail(
    user.email,
    user.firstName,
    user.role,
    data.password
  );

  return {
    ...sanitizeUser(user),
    role: user.role,
    inviteEmailSent: emailResult.sent,
    inviteEmailRequired: roleReceivesInviteEmail(user.role),
  };
}

export async function listInspectors() {
  const users = await prisma.user.findMany({
    where: { role: UserRole.INSPECTOR },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });
  return users;
}

async function assertInspectorId(inspectorId: string | null | undefined) {
  if (!inspectorId) return;
  const inspector = await prisma.user.findUnique({ where: { id: inspectorId } });
  if (!inspector || inspector.role !== UserRole.INSPECTOR) {
    throw new ValidationError([
      { field: 'assignedInspectorId', message: 'Assigned user must be an inspector' },
    ]);
  }
}

export { assertInspectorId };

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  }
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('User not found');

  if (data.email) {
    const dup = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), NOT: { id } },
    });
    if (dup) throw new ConflictError('Email already in use');
  }

  const updateData: Record<string, unknown> = {};
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.role) updateData.role = data.role;
  const newPassword = data.password;
  if (newPassword) {
    updateData.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });

  let inviteEmailSent: boolean | undefined;
  if (newPassword && roleReceivesInviteEmail(user.role)) {
    const emailResult = await sendInviteEmail(
      user.email,
      user.firstName,
      user.role,
      newPassword
    );
    inviteEmailSent = emailResult.sent;
  }

  return {
    ...sanitizeUser(user),
    ...(inviteEmailSent !== undefined && { inviteEmailSent }),
  };
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('User not found');

  if (existing.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new ConflictError('Cannot delete the only administrator account');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.fireExtinguisher.updateMany({
      where: { assignedInspectorId: id },
      data: { assignedInspectorId: null },
    });
    await tx.inspection.deleteMany({ where: { scheduledById: id } });
    await tx.maintenanceLog.deleteMany({ where: { inspectorId: id } });
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.refreshToken.deleteMany({ where: { userId: id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: id } });
    await tx.emailOtp.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  return { message: 'User deleted successfully' };
}
