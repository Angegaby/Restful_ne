import {
  PrismaClient,
  UserRole,
  ExtinguisherType,
  ExtinguisherSize,
  ExtinguisherStatus,
  InspectionStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'angegaby200@gmail.com';
const ADMIN_PASSWORD = 'Hello@2026';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Remove old demo accounts (optional cleanup from previous seeds)
  const oldDemoEmails = ['admin@tzw.com', 'inspector@tzw.com', 'user@tzw.com'];
  const oldUsers = await prisma.user.findMany({
    where: { email: { in: oldDemoEmails } },
    select: { id: true },
  });
  if (oldUsers.length > 0) {
    const ids = oldUsers.map((u) => u.id);
    await prisma.maintenanceLog.deleteMany({});
    await prisma.inspection.deleteMany({ where: { scheduledById: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.emailOtp.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      emailVerified: true,
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'Gabriella',
      lastName: 'Admin',
    },
    create: {
      firstName: 'Gabriella',
      lastName: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const ext1 = await prisma.fireExtinguisher.upsert({
    where: { serialNumber: 'FE-001-2024' },
    update: {},
    create: {
      serialNumber: 'FE-001-2024',
      location: 'Building A - Floor 1',
      type: ExtinguisherType.CO2,
      size: ExtinguisherSize.LB_5,
      installationDate: new Date('2024-01-15'),
      expiryDate: new Date('2026-01-15'),
      status: ExtinguisherStatus.ACTIVE,
    },
  });

  const ext2 = await prisma.fireExtinguisher.upsert({
    where: { serialNumber: 'FE-002-2023' },
    update: {},
    create: {
      serialNumber: 'FE-002-2023',
      location: 'Building B - Lobby',
      type: ExtinguisherType.FOAM,
      size: ExtinguisherSize.LB_9,
      installationDate: new Date('2023-06-01'),
      expiryDate: new Date('2025-06-01'),
      status: ExtinguisherStatus.EXPIRED,
    },
  });

  await prisma.fireExtinguisher.upsert({
    where: { serialNumber: 'FE-003-2024' },
    update: {},
    create: {
      serialNumber: 'FE-003-2024',
      location: 'Warehouse - Section C',
      type: ExtinguisherType.DRY_CHEMICAL,
      size: ExtinguisherSize.LB_12,
      installationDate: new Date('2024-03-10'),
      expiryDate: new Date('2027-03-10'),
      status: ExtinguisherStatus.ACTIVE,
    },
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  await prisma.inspection.deleteMany({});
  await prisma.inspection.create({
    data: {
      extinguisherId: ext1.id,
      scheduledById: admin.id,
      scheduledDate: futureDate,
      scheduledTime: '10:00',
      status: InspectionStatus.PENDING,
      notes: 'Routine quarterly inspection',
    },
  });

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);

  await prisma.inspection.create({
    data: {
      extinguisherId: ext2.id,
      scheduledById: admin.id,
      scheduledDate: pastDate,
      scheduledTime: '14:00',
      status: InspectionStatus.OVERDUE,
    },
  });

  await prisma.maintenanceLog.deleteMany({});
  await prisma.notification.deleteMany({});

  console.log('Seed completed:');
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  Create inspectors and users from Admin → Users in the app.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
