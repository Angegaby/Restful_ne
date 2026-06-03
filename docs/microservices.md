# Microservices Identification and API Design

## Logical Microservices

| Service | Responsibility | API Prefix |
|---------|----------------|------------|
| Authentication Service | Register, login, logout, JWT, password reset | `/api/auth` |
| User Management Service | Profile, password, admin user CRUD | `/api/users` |
| Fire Extinguisher Management Service | Inventory CRUD | `/api/extinguishers` |
| Inspection & Maintenance Service | Schedule/complete inspections, maintenance logs | `/api/inspections`, `/api/maintenance` |
| Reporting Service | Real-time aggregates, PDF/CSV export | `/api/reports` |
| Notification Service | Alert personnel on events | `/api/notifications` |

## Deployment Model

Implemented as a **modular monolith** (single Express application) for exam demonstration. Each module maps to a logical microservice with isolated routes, services, and Swagger tags. Can be split into separate deployables behind an API gateway in production.

## OpenAPI Documentation

- Interactive: `http://localhost:4000/api/docs`
- JSON spec: `http://localhost:4000/api/docs.json`
