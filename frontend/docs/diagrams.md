# FEMS — System diagrams (Mermaid)

Copy either block into [Mermaid Live Editor](https://mermaid.live), GitHub markdown, or documentation tools.

## System architecture

```mermaid
flowchart TB
  subgraph clients["Client tier"]
    Browser["Web browser"]
    NextApp["Next.js 14 frontend\n(React, Tailwind)"]
    Browser --> NextApp
  end

  subgraph api["Application tier"]
    Express["Express REST API\n/modules, middleware"]
    AuthMW["JWT auth + role guards"]
    Validate["Zod validation"]
    Scope["Role-based scope\n(ADMIN / INSPECTOR / USER)"]
    Express --> AuthMW
    AuthMW --> Validate
    Validate --> Scope
  end

  subgraph modules["API modules"]
    AuthM["/api/auth"]
    UsersM["/api/users"]
    ExtM["/api/extinguishers"]
    InspM["/api/inspections"]
    MaintM["/api/maintenance"]
    RepM["/api/reports"]
    NotifM["/api/notifications"]
  end

  subgraph data["Data tier"]
    Prisma["Prisma ORM"]
    PG[("PostgreSQL")]
    Prisma --> PG
  end

  subgraph external["External services"]
    SMTP["SMTP email\n(invites, OTP, reset)"]
    PDF["PDFKit + CSV export"]
  end

  NextApp -->|"HTTPS / JSON\nBearer access token"| Express
  Scope --> AuthM
  Scope --> UsersM
  Scope --> ExtM
  Scope --> InspM
  Scope --> MaintM
  Scope --> RepM
  Scope --> NotifM
  modules --> Prisma
  RepM --> PDF
  AuthM --> SMTP
  UsersM --> SMTP

  classDef client fill:#e8f4f3,stroke:#0d4f4f
  classDef server fill:#fef6e8,stroke:#c47d2a
  classDef db fill:#f0ebe3,stroke:#5c4d3d
  class Browser,NextApp client
  class Express,AuthMW,Validate,Scope server
  class Prisma,PG db
```

## Database ER diagram

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ EmailOtp : has
  User ||--o{ PasswordResetToken : has
  User ||--o{ Inspection : schedules
  User ||--o{ MaintenanceLog : performs
  User ||--o{ Notification : receives
  User ||--o{ FireExtinguisher : "assigned as inspector"

  FireExtinguisher ||--o{ Inspection : has
  FireExtinguisher ||--o{ MaintenanceLog : has

  User {
    uuid id PK
    string first_name
    string last_name
    string email UK
    string password_hash
    enum role "ADMIN|INSPECTOR|USER"
    boolean email_verified
    datetime created_at
    datetime updated_at
  }

  FireExtinguisher {
    uuid id PK
    string serial_number UK
    string location
    enum type "WATER|CO2|FOAM|DRY_CHEMICAL"
    enum size "LB_1_5|LB_5|LB_9|LB_12"
    date installation_date
    date expiry_date
    enum status "ACTIVE|EXPIRED|MAINTENANCE|DECOMMISSIONED"
    uuid assigned_inspector_id FK
    datetime created_at
    datetime updated_at
  }

  Inspection {
    uuid id PK
    uuid extinguisher_id FK
    uuid scheduled_by_id FK
    date scheduled_date
    string scheduled_time
    enum status "PENDING|COMPLETED|OVERDUE"
    string notes
    datetime completed_at
    datetime created_at
    datetime updated_at
  }

  MaintenanceLog {
    uuid id PK
    uuid extinguisher_id FK
    uuid inspector_id FK
    string action_taken
    date maintenance_date
    string issues_identified
    string notes
    datetime created_at
  }

  Notification {
    uuid id PK
    uuid user_id FK
    string message
    boolean read
    datetime created_at
  }

  RefreshToken {
    uuid id PK
    uuid user_id FK
    string token_hash
    datetime expires_at
  }

  EmailOtp {
    uuid id PK
    uuid user_id FK
    string code_hash
    datetime expires_at
    boolean used
  }

  PasswordResetToken {
    uuid id PK
    uuid user_id FK
    string token_hash
    datetime expires_at
    boolean used
  }
```

## Role-based access (reference)

```mermaid
flowchart LR
  Admin["ADMIN"]
  Inspector["INSPECTOR"]
  User["USER"]

  Admin --> RegAssets["Register & assign extinguishers"]
  Admin --> ManageUsers["Manage users"]
  Admin --> ViewReports["View reports & exports"]

  Inspector --> CompleteInsp["Complete inspections"]
  Inspector --> LogMaint["Log maintenance"]
  Inspector --> ViewAssigned["View assigned assets"]

  User --> RequestInsp["Request inspections"]
  User --> ViewStatus["View status & reports"]
```
