# NexusOps Architecture Document

## Overview

NexusOps Control Center is an enterprise operations and compliance orchestration platform built on ITIL principles. It provides a unified system for incident management, problem management, change management, service catalog, knowledge base, and compliance tracking.

---

## Technology Stack

### Backend (apps/api)
- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15.x
- **ORM:** Prisma 5.x
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI
- **Validation:** class-validator, class-transformer
- **Queue:** BullMQ (Redis-backed)
- **Caching:** Redis

### Frontend (apps/web)
- **Framework:** Next.js 14.x (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS
- **State Management:** React Context + SWR/TanStack Query
- **UI Components:** Custom components with Radix UI primitives

### Shared Packages
- **@nexusops/contracts:** Shared TypeScript types and interfaces
- **@nexusops/logging:** Centralized logging utilities
- **@nexusops/ui:** Shared UI component library

### Infrastructure
- **Container Runtime:** Docker
- **Orchestration:** Docker Compose (development), Kubernetes-ready
- **Process Manager:** PM2 (production)

---

## Project Structure

```
test-glm5-demo/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── prisma/         # Prisma client module
│   │   │   ├── queue/          # BullMQ queue setup
│   │   │   ├── cache/          # Redis cache module
│   │   │   └── main.ts         # Application entry
│   │   └── prisma/
│   │       ├── schema.prisma   # Database schema
│   │       ├── migrations/     # Database migrations
│   │       └── seed.ts         # Seed data
│   │
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # React components
│   │   │   └── lib/            # Utilities and API client
│   │   └── public/
│   │
│   └── worker/                 # Background worker service
│
├── packages/
│   ├── contracts/              # Shared types
│   ├── logging/                # Logging utilities
│   └── ui/                     # Shared UI components
│
├── docs/                       # Documentation
├── dist/                       # Build output (generated)
└── node_modules/
```

---

## Module Architecture

The backend follows a modular architecture with clear separation of concerns:

### Core Modules

```
apps/api/src/modules/
├── activities/           # Unified activity tracking
├── admin-governance/     # CAB, privileged access
├── audit/                # Audit logging
├── auth/                 # Authentication & authorization
├── changes/              # Change management (ITIL)
├── configuration-items/  # CMDB
├── dashboard/            # Dashboard metrics
├── export/               # CSV/Excel export
├── incidents/            # Incident management (ITIL)
├── knowledge/            # Knowledge base
├── monitoring/           # Health & metrics
├── notifications/        # User notifications
├── organizations/        # Multi-tenancy
├── policies/             # Policy management
├── problems/             # Problem management (ITIL)
├── reports/              # Report generation
├── roles/                # RBAC
├── service-catalog/      # Service request management
├── settings/             # Webhooks & integrations
├── sla-dashboard/        # SLA monitoring
├── tasks/                # Task management
├── teams/                # Team management
├── users/                # User management
├── violations/           # Compliance violations
└── workflows/            # Workflow engine
```

### Module Structure

Each module follows the standard NestJS pattern:

```
module/
├── dto/                  # Data Transfer Objects
├── entities/             # Domain entities
├── *.controller.ts       # HTTP endpoints
├── *.service.ts          # Business logic
└── *.module.ts           # Module definition
```

---

## Database Schema

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐
│  Organization   │────<│      User       │
└─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│      Team       │     │   UserRole      │
└─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │      Role       │
                        └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   Permission    │
                        └─────────────────┘
```

### ITIL Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Incident     │────>│     Problem     │<────│  ChangeRequest  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ IncidentComment │     │      Task       │     │ ChangeApproval  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ IncidentTimeline│     │  Workflow       │
└─────────────────┘     └─────────────────┘
```

### Key Database Tables

| Table | Purpose |
|-------|---------|
| `Organization` | Multi-tenant organization |
| `User` | User accounts |
| `Team` / `TeamMembership` | Team structure |
| `Role` / `Permission` / `UserRole` / `RolePermission` | RBAC |
| `Incident` | ITIL incident records |
| `Problem` | ITIL problem records |
| `ChangeRequest` / `ChangeApproval` | ITIL change management |
| `Task` | Unified task tracking |
| `Workflow` | Workflow state machine |
| `Policy` / `PolicyException` | Compliance policies |
| `Violation` | Policy violations |
| `ServiceCatalogItem` / `ServiceRequest` | Service catalog |
| `KnowledgeArticle` / `KnowledgeArticleVersion` | Knowledge base |
| `AuditLog` | Audit trail |
| `Activity` | Unified activity feed |
| `SLAPolicy` | SLA definitions |
| `ConfigurationItem` | CMDB items |
| `Notification` / `NotificationPreference` | User notifications |
| `Webhook` | Integration webhooks |
| `ReportJob` | Async report generation |
| `CABPolicy` / `CABMember` | Change Advisory Board |

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐     POST /auth/login      ┌─────────┐
│  Client │ ────────────────────────> │   API   │
└─────────┘                           └─────────┘
     │                                     │
     │     JWT Access Token + Refresh Token│
     │<────────────────────────────────────│
     │                                     │
     │     GET /api/incidents              │
     │────────────────────────────────────>│
     │     Authorization: Bearer <token>   │
     │                                     │
     │     Incidents data                  │
     │<────────────────────────────────────│
```

### JWT Strategy

- **Access Token:** Short-lived (15 minutes default)
- **Refresh Token:** Long-lived (7 days default)
- **Algorithm:** RS256 or HS256

### Role-Based Access Control (RBAC)

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

#### Permission Format
```
<resource>:<action>
Examples:
- incidents:read
- incidents:write
- incidents:update
- incidents:delete
- admin:all (superuser)
```

#### Permission Guards

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("incidents:read")
@Controller("incidents")
export class IncidentsController { ... }
```

---

## Workflow Engine

The workflow engine provides a state machine for orchestrating multi-step processes.

### Workflow Structure

```typescript
interface Workflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  entityId: string;           // Associated entity
  entityType: string;         // incident, change, etc.
  currentStepId: string;
  steps: WorkflowStep[];
  context: Record<string, unknown>;
}
```

### Workflow Types
- `incident_approval`
- `policy_review`
- `report_generation`
- Custom templates

### Workflow Operations
- **Advance:** Move to next step
- **Rollback:** Return to previous step
- **Cancel:** Terminate workflow

### Workflow Templates

Templates are stored in a registry and can be instantiated:

```typescript
POST /workflows/from-template
{
  "templateId": "incident-escalation",
  "entityId": "incident-123",
  "entityType": "incident",
  "context": { "priority": "critical" }
}
```

---

## Multi-Tenancy

### Organization Isolation

All data is scoped to organizations via `organizationId`:

```typescript
// Every query includes organization filter
await prisma.incident.findMany({
  where: { organizationId: req.user.organizationId }
});
```

### Organization Context

The JWT token includes organization membership:

```typescript
interface JwtPayload {
  userId: string;
  organizationId: string;
  roles: string[];
}
```

---

## Audit Trail

### Automatic Auditing

The `@Audited()` decorator automatically logs changes:

```typescript
@Audited({
  action: "incident.update",
  resource: "incident",
  capturePreviousValue: true,
  captureNewValue: true,
})
async update(@Param("id") id: string, @Body() dto: UpdateDto) { ... }
```

### Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string;
  actorType: "user" | "system" | "integration";
  action: string;
  resource: string;
  resourceId: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
  createdAt: Date;
}
```

### Correlation IDs

Every request is assigned a correlation ID via middleware for distributed tracing.

---

## Event-Driven Features

### Notification System

```typescript
// Event emission
eventEmitter.emit("incident.created", { incident, user });

// Listener handles notification
@OnEvent("incident.created")
async handleIncidentCreated(event: IncidentCreatedEvent) {
  // Send notifications
}
```

### Webhook Integration

```typescript
// Webhook triggers on configured events
await this.webhookService.trigger({
  event: "incident.resolved",
  payload: { incident },
  organizationId
});
```

---

## Caching Strategy

### Redis Cache

```typescript
// Cache key pattern
const cacheKey = `org:${organizationId}:incidents:${queryHash}`;

// Cache invalidation on write
await this.cacheService.invalidate(`org:${organizationId}:incidents:*`);
```

### Cache Layers
1. **Query Cache:** Frequently accessed list queries
2. **Session Cache:** User sessions
3. **Rate Limiting:** API rate limit counters

---

## Queue System (BullMQ)

### Job Queues

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Report Queue   │     │  Export Queue   │     │ Notification    │
│                 │     │                 │     │    Queue        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Job Types
- **Report Generation:** Async PDF/CSV report creation
- **Data Export:** Large dataset exports
- **Notifications:** Email/push notification delivery
- **Webhooks:** Outbound webhook delivery

---

## Frontend Architecture

### App Router Structure

```
apps/web/src/app/
├── (dashboard)/           # Authenticated routes
│   ├── dashboard/
│   ├── incidents/
│   ├── problems/
│   ├── changes/
│   ├── tasks/
│   └── ...
├── login/                 # Public routes
├── api/                   # API routes (if needed)
├── layout.tsx             # Root layout
├── providers.tsx          # Context providers
└── globals.css            # Global styles
```

### State Management

```
┌─────────────────┐
│   React Query   │  ← Server state (API data)
└─────────────────┘
┌─────────────────┐
│ React Context   │  ← Client state (UI state, auth)
└─────────────────┘
```

### API Client

```typescript
// Centralized API client with auth
const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getAccessToken: () => getAccessToken(),
});
```

---

## Deployment Architecture

### Container Structure

```yaml
services:
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [postgres, redis]
  
  web:
    build: ./apps/web
    ports: ["3000:3000"]
  
  worker:
    build: ./apps/worker
    depends_on: [redis]
  
  postgres:
    image: postgres:15
    ports: ["5433:5432"]
  
  redis:
    image: redis:7
```

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Full health check (DB, Redis, etc.) |
| `/health/live` | Kubernetes liveness probe |
| `/health/ready` | Kubernetes readiness probe |
| `/metrics` | Prometheus metrics |

---

## Security Considerations

### Authentication
- JWT tokens with short expiration
- Refresh token rotation
- Secure cookie storage for web clients

### Authorization
- Role-based access control (RBAC)
- Permission guards on all endpoints
- Organization-level data isolation

### Data Protection
- Input validation with class-validator
- SQL injection protection via Prisma
- XSS protection via React
- CORS configuration

### Audit & Compliance
- Comprehensive audit logging
- Correlation IDs for traceability
- Data retention policies

---

## Monitoring & Observability

### Metrics (Prometheus)

```
# HTTP metrics
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

# Business metrics
incidents_total{status, priority}
sla_compliance_ratio
```

### Logging

```typescript
// Structured logging
logger.info("Incident created", {
  incidentId,
  organizationId,
  userId,
  correlationId
});
```

### Alerting

- SLA breach warnings
- System health alerts
- Error rate thresholds

---

## API Versioning

Currently on version 1.0. Future versions will use:

- **URL Path:** `/api/v2/...`
- **Header:** `Accept: application/vnd.nexusops.v2+json`

---

## Development Workflow

### Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # All services
pnpm dev:api          # API only
pnpm dev:web          # Web only

# Database
pnpm db:up            # Start Postgres
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed data
pnpm db:down          # Stop database

# Build & Test
pnpm build
pnpm test
pnpm lint
pnpm format
```

### Environment Variables

```bash
# API
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_EXPIRATION=900

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Future Considerations

### Scalability
- Horizontal API scaling with load balancer
- Database read replicas
- Redis cluster for caching

### Features
- Advanced analytics and reporting
- Machine learning for incident classification
- Integration marketplace
- Mobile application support

### Compliance
- SOC 2 certification readiness
- GDPR data handling
- Data encryption at rest
