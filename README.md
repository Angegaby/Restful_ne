# Fire Extinguisher Management System (FEMS)

**TZW LTD** — RESTful Microservices-Based Fire Extinguisher Management System

National exam project: Next.js frontend, Node.js/Express backend, PostgreSQL database.

## Architecture

Modular monolith implementing logical microservices:

- **Authentication Service** — JWT login, register, logout, password reset
- **User Management Service** — Profiles, RBAC (Admin, Inspector, User)
- **Fire Extinguisher Service** — Inventory CRUD
- **Inspection & Maintenance Service** — Scheduling, completion, maintenance logs
- **Reporting Service** — Real-time reports with PDF/CSV export
- **Notification Service** — Personnel alerts on scheduled inspections

## Quick Start

### 1. PostgreSQL

**Option A — Docker** (if Docker Desktop is running):

```bash
docker compose up -d
```

**Option B — Local PostgreSQL:**

```sql
CREATE DATABASE fems_db;
```

Update `backend/.env` `DATABASE_URL` with your PostgreSQL username and password.

### 2. Backend (port 4000)

```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 3. Frontend (port 3000)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000

### Admin login (after `npm run db:seed`)

| Email | Password | Role |
|-------|----------|------|
| angegaby200@gmail.com | Hello@2026 | Admin |

Create inspectors and users from **Admin → Users** in the app.

## Deliverables

| Item | Location |
|------|----------|
| Source code | `backend/`, `frontend/` |
| Swagger API docs | http://localhost:4000/api/docs |
| OpenAPI JSON | http://localhost:4000/api/docs.json |
| ERD | [docs/erd.md](docs/erd.md) |
| Database schema | [backend/prisma/schema.prisma](backend/prisma/schema.prisma) |
| Backup script | [database/backup.ps1](database/backup.ps1) |
| Deployment guide | [docs/deployment.md](docs/deployment.md) |
| User manual | [docs/user-manual.md](docs/user-manual.md) |
| Test results | [docs/test-results.md](docs/test-results.md) |
| Exam specification | [paper.md](paper.md) |

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/users/me
PUT    /api/users/me
PUT    /api/users/me/password
GET    /api/extinguishers
POST   /api/extinguishers          (Admin)
GET    /api/inspections
POST   /api/inspections
PATCH  /api/inspections/:id/complete
POST   /api/maintenance            (Inspector+)
GET    /api/reports/inventory
GET    /api/reports/:type/export?format=pdf|csv
```

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind, React Hook Form, Zod
- **Backend:** Express 5, TypeScript, Prisma, Zod, JWT, bcrypt, Swagger
- **Database:** PostgreSQL

## Tests

```bash
cd backend && npm test
```
