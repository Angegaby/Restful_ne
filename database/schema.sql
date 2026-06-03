-- FEMS Database Schema (generated from Prisma)
-- Run via: npx prisma migrate dev (recommended)

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INSPECTOR', 'USER');
CREATE TYPE "ExtinguisherType" AS ENUM ('WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL');
CREATE TYPE "ExtinguisherSize" AS ENUM ('LB_1_5', 'LB_5', 'LB_9', 'LB_12');
CREATE TYPE "ExtinguisherStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'MAINTENANCE', 'DECOMMISSIONED');
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- See backend/prisma/schema.prisma for full model definitions
-- Use: cd backend && npx prisma db push && npm run db:seed
