# API Test Results

**Last run:** Automated validation suite + integration (requires DB)

## Automated Tests

| Suite | Result | Notes |
|-------|--------|-------|
| `tests/validation.test.ts` | **10/10 PASS** | Zod validation — no database required |
| `tests/health.test.ts` | PASS | `GET /api/health` |
| `tests/auth.test.ts` | Requires DB | Register/login/me flow |
| `tests/integration.full.test.ts` | Requires DB | Full exam coverage (30+ assertions) |

### Validation tests passed

- Weak password rejected on register
- Valid register payload accepted
- Invalid email rejected on login
- Expiry before installation rejected
- Valid extinguisher payload accepted
- Invalid type enum rejected
- Invalid inspection time rejected
- Valid inspection schedule accepted
- Empty maintenance action rejected
- Weak new password rejected on change-password

## Integration test (run after DB setup)

```bash
cd backend
# Fix DATABASE_URL in .env first!
npx prisma db push
npm run db:seed
npm test
```

Covers: RBAC (403), CRUD extinguishers, inspections, notifications, maintenance, all 4 reports, PDF/CSV export, Swagger JSON, duplicate serial 409, past inspection date 422.

## Exam requirement checklist

| Requirement | Status |
|-------------|--------|
| **Activity 1** Microservices documented | `docs/microservices.md` |
| OpenAPI / Swagger | `/api/docs`, `docs/openapi.json` |
| ERD + schema | `docs/erd.md`, `prisma/schema.prisma` |
| UI screens (Figma optional) | Next.js pages — you add Figma |
| **Activity 2** Roles Admin/Inspector/User | Implemented + RBAC |
| Registration + validation + duplicate block | Implemented |
| bcrypt password hashing | Implemented |
| JWT login/logout/me | Implemented |
| Profile view/update/password | Implemented |
| Forgot/reset password | Implemented |
| **Activity 3** Extinguisher CRUD | Implemented |
| Types: Water, CO2, Foam, Dry Chemical | Enum |
| Sizes: 1.5, 5, 9, 12 lb | Enum `LB_1_5`, `LB_5`, `LB_9`, `LB_12` |
| Inspection schedule + notify | Implemented |
| Maintenance log all fields | Implemented |
| **Activity 4** Inventory reports | Implemented |
| Inspection reports (pending/completed/overdue) | Implemented |
| Compliance (expired/upcoming/status) | Implemented |
| Maintenance history/frequency/recent | Implemented |
| **Activity 5** Swagger | Implemented |
| PDF + CSV export | Implemented |
| Backup script | `database/backup.ps1` |
| Deployment guide + user manual | `docs/` |

## Blocker for live API tests on this machine

`DATABASE_URL` uses `postgres:postgres` but PostgreSQL 18 rejected authentication. **Update `backend/.env`** with your real PostgreSQL password, then:

```bash
npx prisma db push
npm run db:seed
npm run dev
```
