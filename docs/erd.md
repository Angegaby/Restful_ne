# Entity Relationship Diagram — FEMS

## Mermaid ERD

```mermaid
erDiagram
    users ||--o{ refresh_tokens : has
    users ||--o{ password_reset_tokens : has
    users ||--o{ inspections : schedules
    users ||--o{ maintenance_logs : performs
    users ||--o{ notifications : receives
    fire_extinguishers ||--o{ inspections : has
    fire_extinguishers ||--o{ maintenance_logs : has

    users {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string password_hash
        enum role
        datetime created_at
        datetime updated_at
    }

    fire_extinguishers {
        uuid id PK
        string serial_number UK
        string location
        enum type
        enum size
        date installation_date
        date expiry_date
        enum status
    }

    inspections {
        uuid id PK
        uuid extinguisher_id FK
        uuid scheduled_by_id FK
        date scheduled_date
        string scheduled_time
        enum status
        text notes
        datetime completed_at
    }

    maintenance_logs {
        uuid id PK
        uuid extinguisher_id FK
        uuid inspector_id FK
        string action_taken
        date maintenance_date
        text issues_identified
        text notes
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text message
        boolean read
    }
```

## Table Relationships

| Parent | Child | Relationship |
|--------|-------|--------------|
| users | refresh_tokens | 1:N cascade delete |
| users | password_reset_tokens | 1:N cascade delete |
| users | inspections | 1:N (scheduled_by) |
| users | maintenance_logs | 1:N (inspector) |
| users | notifications | 1:N cascade delete |
| fire_extinguishers | inspections | 1:N cascade delete |
| fire_extinguishers | maintenance_logs | 1:N cascade delete |

## Indexes

- `users.email` — UNIQUE
- `fire_extinguishers.serial_number` — UNIQUE
- `fire_extinguishers.expiry_date`, `installation_date`, `status`
- `inspections.scheduled_date`, `status`, `extinguisher_id`
- `maintenance_logs.maintenance_date`, `extinguisher_id`

## Logical Microservices Mapping

| Service | Tables |
|---------|--------|
| User Management | users |
| Authentication | users, refresh_tokens, password_reset_tokens |
| Fire Extinguisher | fire_extinguishers |
| Inspection & Maintenance | inspections, maintenance_logs |
| Notification | notifications |
| Reporting | Aggregates across all tables |
