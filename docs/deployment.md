# Deployment Guide — FEMS

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm

## 1. Database Setup

```sql
CREATE DATABASE fems_db;
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL and JWT secrets

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API: http://localhost:4000  
Swagger: http://localhost:4000/api/docs

## 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

## 4. Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_ACCESS_SECRET | Min 32 characters |
| JWT_REFRESH_SECRET | Min 32 characters |
| PORT | Default 4000 |
| FRONTEND_URL | CORS origin (http://localhost:3000) |
| RESET_PASSWORD_URL | Frontend reset page URL |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:4000/api |

## 5. Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## 6. Database Backup

```powershell
cd database
.\backup.ps1
```

Or: `pg_dump -U postgres -d fems_db > backup.sql`

## 7. Demo Accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| angegaby200@gmail.com | Hello@2026 | ADMIN |

Inspectors and users are created by the admin in the app (not seeded).
