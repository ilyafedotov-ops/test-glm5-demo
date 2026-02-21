# NexusOps API Reference

**Version:** 1.0  
**Base URL:** `/api`  
**Documentation:** `/api/docs` (Swagger UI)

## Authentication

All API endpoints (except `/auth/login` and health endpoints) require JWT Bearer token authentication.

```
Authorization: Bearer <access_token>
```

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login with email and password | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| POST | `/auth/logout` | Logout current user | Yes |

---

## Incident Management

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/incidents` | List all incidents with filtering | `incidents:read` |
| POST | `/incidents` | Create a new incident | `incidents:write` |
| GET | `/incidents/options` | Get form options (categories, channels) | `incidents:read` |
| GET | `/incidents/:id` | Get incident by ID | `incidents:read` |
| GET | `/incidents/:id/duplicates` | Find potential duplicate incidents | `incidents:read` |
| PATCH | `/incidents/:id` | Update incident | `incidents:update` |
| POST | `/incidents/:id/transition` | ITIL status transition with gate checks | `incidents:update` |
| POST | `/incidents/:id/comments` | Add comment to incident | `incidents:update` |
| POST | `/incidents/merge` | Merge duplicate incidents | `incidents:update` |
| GET | `/incidents/export/csv` | Export incidents to CSV | `incidents:read` |

### Incident States (ITIL)
- `new` → `assigned` → `in_progress` → `pending` → `resolved` → `closed` → `cancelled`

### Incident Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `priority` | string | Filter by priority (critical, high, medium, low) |
| `assigneeId` | string | Filter by assignee |
| `teamId` | string | Filter by team |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

---

## Problem Management (ITIL)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/problems` | List all problems | `problems:read` |
| POST | `/problems` | Create a new problem | `problems:write` |
| GET | `/problems/options` | Get form options (incidents, users, teams) | `problems:read` |
| GET | `/problems/:id` | Get problem details | `problems:read` |
| PATCH | `/problems/:id` | Update problem | `problems:update` |
| POST | `/problems/:id/tasks` | Add task to problem | `problems:update` |
| POST | `/problems/:id/convert-to-known-error` | Convert to known error | `problems:update` |

### Problem States
- `new` → `investigating` → `known_error` → `root_cause_identified` → `resolved` → `closed`

---

## Change Management (ITIL)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/changes` | List all change requests | `changes:read` |
| POST | `/changes` | Create a new change request | `changes:write` |
| GET | `/changes/:id` | Get change request details | `changes:read` |
| PATCH | `/changes/:id` | Update change request | `changes:update` |
| POST | `/changes/:id/submit` | Submit for approval | `changes:update` |
| POST | `/changes/:id/approve` | Approve change request | `changes:update` |
| POST | `/changes/:id/reject` | Reject change request | `changes:update` |
| POST | `/changes/:id/implement` | Start implementation | `changes:update` |
| POST | `/changes/:id/complete` | Mark as completed | `changes:update` |
| POST | `/changes/:id/tasks` | Add task to change | `changes:update` |

### Change Types
- `standard` - Pre-approved, low-risk changes
- `normal` - Require CAB approval
- `emergency` - Expedited approval process

### Change States
- `draft` → `requested` → `assessing` → `scheduled` → `approved`/`rejected` → `implementing` → `completed`/`failed`

---

## Task Management

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/tasks` | List all tasks | `tasks:read` |
| POST | `/tasks` | Create a new task | `tasks:write` |
| GET | `/tasks/options` | Get form options (users, teams) | `tasks:read` |
| GET | `/tasks/stats` | Get task statistics | `tasks:read` |
| GET | `/tasks/:id` | Get task by ID | `tasks:read` |
| PATCH | `/tasks/:id` | Update task | `tasks:update` |
| POST | `/tasks/:id/assign` | Assign task to user | `tasks:update` |
| POST | `/tasks/:id/start` | Start working on task | `tasks:update` |
| POST | `/tasks/:id/complete` | Mark task as completed | `tasks:update` |
| POST | `/tasks/:id/reopen` | Reopen a task | `tasks:update` |
| POST | `/tasks/:id/cancel` | Cancel a task | `tasks:update` |
| DELETE | `/tasks/:id` | Delete a task | `tasks:delete` |

### Task States
- `pending` → `in_progress` → `completed`/`cancelled`

---

## Workflow Management

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/workflows` | List all workflows | `workflows:read` |
| POST | `/workflows` | Create a new workflow | `workflows:write` |
| GET | `/workflows/templates` | List workflow templates | `workflows:read` |
| POST | `/workflows/from-template` | Create workflow from template | `workflows:write` |
| GET | `/workflows/exception-analytics` | Get exception analytics | `workflows:read` |
| GET | `/workflows/:id` | Get workflow by ID | `workflows:read` |
| POST | `/workflows/:id/advance` | Advance workflow to next step | `workflows:update` |
| POST | `/workflows/:id/cancel` | Cancel a workflow | `workflows:update` |
| POST | `/workflows/:id/rollback` | Rollback to previous step | `workflows:update` |
| DELETE | `/workflows/:id` | Delete a workflow | `workflows:delete` |

### Workflow States
- `pending` → `in_progress` → `completed`/`cancelled`

---

## Service Catalog

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/service-catalog/items` | List service catalog items | `service_catalog:read` |
| POST | `/service-catalog/items` | Create catalog item | `service_catalog:write` |
| GET | `/service-catalog/items/:id` | Get item details | `service_catalog:read` |
| GET | `/service-catalog/requests` | List service requests | `service_catalog:read` |
| POST | `/service-catalog/requests` | Submit a service request | `service_catalog:write` |
| GET | `/service-catalog/requests/:id` | Get request details | `service_catalog:read` |
| POST | `/service-catalog/requests/:id/approve` | Approve request | `service_catalog:update` |
| POST | `/service-catalog/requests/:id/reject` | Reject request | `service_catalog:update` |
| POST | `/service-catalog/requests/:id/fulfill` | Mark as fulfilled | `service_catalog:update` |

### Service Request States
- `requested` → `approved`/`denied` → `fulfilled` → `closed`

---

## Knowledge Base

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/knowledge` | List all knowledge articles | `knowledge:read` |
| POST | `/knowledge` | Create a knowledge article | `knowledge:write` |
| GET | `/knowledge/search` | Search knowledge articles | `knowledge:read` |
| GET | `/knowledge/:id` | Get article details | `knowledge:read` |
| GET | `/knowledge/:id/versions` | List article version history | `knowledge:read` |
| PATCH | `/knowledge/:id` | Update article | `knowledge:update` |
| POST | `/knowledge/:id/publish` | Publish article | `knowledge:update` |
| POST | `/knowledge/:id/archive` | Archive article | `knowledge:update` |
| POST | `/knowledge/:id/helpful` | Mark as helpful | `knowledge:update` |
| POST | `/knowledge/:id/not-helpful` | Mark as not helpful | `knowledge:update` |
| POST | `/knowledge/:id/revert` | Revert to previous version | `knowledge:update` |

---

## Policy & Compliance

### Policies

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/policies` | List all policies | `policies:read` |
| POST | `/policies` | Create a new policy | `policies:write` |
| GET | `/policies/:id` | Get policy details | `policies:read` |
| PATCH | `/policies/:id` | Update policy | `policies:write` |
| GET | `/policies/:id/exceptions` | List policy exceptions | `policies:read` |
| POST | `/policies/:id/exceptions` | Create exception request | `policies:write` |
| POST | `/policies/:id/exceptions/:exceptionId/approve` | Approve exception | `policies:write` |
| POST | `/policies/:id/exceptions/:exceptionId/reject` | Reject exception | `policies:write` |

### Violations

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/violations` | List all violations | `violations:read` |
| POST | `/violations` | Create a violation | `violations:write` |
| GET | `/violations/stats` | Get violation statistics | `violations:read` |
| GET | `/violations/:id` | Get violation details | `violations:read` |
| PATCH | `/violations/:id` | Update violation | `violations:update` |
| POST | `/violations/:id/acknowledge` | Acknowledge violation | `violations:update` |
| POST | `/violations/:id/remediate` | Mark as remediated | `violations:update` |
| POST | `/violations/:id/assign` | Assign to user | `violations:update` |
| DELETE | `/violations/:id` | Delete a violation | `violations:delete` |

### Violation States
- `open` → `acknowledged` → `remediated` (or `false_positive`, `wont_fix`)

---

## Configuration Management (CMDB)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/configuration-items` | List configuration items | `admin:all` |
| POST | `/configuration-items` | Create configuration item | `admin:all` |
| GET | `/configuration-items/:id` | Get item details | `admin:all` |
| PATCH | `/configuration-items/:id` | Update item | `admin:all` |
| GET | `/configuration-items/:id/relationships` | Get item relationships | `admin:all` |
| PUT | `/configuration-items/:id/relationships` | Update relationships | `admin:all` |
| DELETE | `/configuration-items/:id` | Delete item | `admin:all` |

### Configuration Item Types
- `application`, `service`, `database`, `infrastructure`, `endpoint`, `other`

---

## Audit & Activity

### Audit Logs

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/audit-logs` | List all audit logs | `admin:all` |
| GET | `/audit-logs/stats` | Get audit statistics | `admin:all` |
| GET | `/audit-logs/export` | Export audit logs as JSON | `admin:all` |
| GET | `/audit-logs/:id` | Get log details with diff | `admin:all` |

### Activities

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/activities` | Get all activities | `activities:read` |
| GET | `/activities/recent` | Get recent activity feed | `activities:read` |
| GET | `/activities/timeline/:entityType/:entityId` | Get entity timeline | `activities:read` |

---

## Dashboard & Reports

### Dashboard

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/dashboard/summary` | Get dashboard summary metrics | `dashboard:read` |
| GET | `/dashboard/correlation-map` | Get cross-domain correlation map | `dashboard:read` |
| GET | `/dashboard/risk-summary` | Get risk scoring summary | `dashboard:read` |

### SLA Dashboard

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/dashboard/sla/metrics` | Get SLA metrics and compliance | `sla:read` |
| GET | `/dashboard/sla/breached` | Get breached SLAs | `sla:read` |
| GET | `/dashboard/sla/at-risk` | Get at-risk SLAs | `sla:read` |
| GET | `/dashboard/sla/targets` | Get SLA target policies | `sla:read` |
| PUT | `/dashboard/sla/targets` | Update SLA target policies | `admin:all` |

### Reports

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/reports` | Get available report types | `reports:read` |
| GET | `/reports/jobs` | Get report job history | `reports:read` |
| POST | `/reports/run` | Run a report | `reports:write` |
| GET | `/reports/jobs/:id` | Get report job status | `reports:read` |

### Report Types
- `incident_summary`, `compliance_audit`, `sla_performance`, `user_activity`, `policy_violations`

---

## User & Organization Management

### Users

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/users` | List all users | `admin:all` |
| POST | `/users` | Create a new user | `admin:all` |
| GET | `/users/:id` | Get user by ID | `admin:all` |
| PATCH | `/users/:id` | Update user | `admin:all` |
| PATCH | `/users/:id/roles` | Update user roles | `admin:all` |

### Teams

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/teams` | List all teams | `admin:all` |
| POST | `/teams` | Create a new team | `admin:all` |
| GET | `/teams/:id` | Get team by ID | `admin:all` |
| PATCH | `/teams/:id` | Update team | `admin:all` |
| DELETE | `/teams/:id` | Delete team | `admin:all` |
| GET | `/teams/:id/members` | Get team members | `admin:all` |
| POST | `/teams/:id/members` | Add member to team | `admin:all` |
| DELETE | `/teams/:id/members/:userId` | Remove member from team | `admin:all` |

### Roles & Permissions

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/roles` | List all roles | `admin:all` |
| GET | `/roles/permissions` | Get all available permissions | `admin:all` |
| GET | `/roles/:id` | Get role by ID | `admin:all` |
| POST | `/roles` | Create a new role | `admin:all` |
| PATCH | `/roles/:id` | Update role | `admin:all` |
| DELETE | `/roles/:id` | Delete role | `admin:all` |

### Organizations

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/organizations/me` | Get current organization | `admin:all` |
| PATCH | `/organizations/me` | Update organization | `admin:all` |
| GET | `/organizations/me/stats` | Get organization statistics | `admin:all` |

---

## Admin & Governance

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/admin-governance/privileged-access-requests` | List privileged access requests | `admin:all` |
| POST | `/admin-governance/privileged-access-requests` | Create privileged access request | `admin:all` |
| POST | `/admin-governance/privileged-access-requests/:id/review` | Review privileged access request | `admin:all` |
| GET | `/admin-governance/cab` | Get CAB configuration | `admin:all` |
| PUT | `/admin-governance/cab/policy` | Update CAB policy | `admin:all` |
| PUT | `/admin-governance/cab/members` | Update CAB members | `admin:all` |

---

## Notifications

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/notifications` | Get user notifications | `notifications:read` |
| PATCH | `/notifications/:id/read` | Mark notification as read | `notifications:update` |
| PATCH | `/notifications/read-all` | Mark all as read | `notifications:update` |
| DELETE | `/notifications/:id` | Delete a notification | `notifications:delete` |
| GET | `/notifications/preferences` | Get notification preferences | `notifications:read` |
| PATCH | `/notifications/preferences` | Update preferences | `notifications:update` |

---

## Settings & Integrations

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/settings/webhooks` | List all webhooks | `admin:all` |
| POST | `/settings/webhooks` | Create a webhook | `admin:all` |
| PUT | `/settings/webhooks/:id` | Update a webhook | `admin:all` |
| DELETE | `/settings/webhooks/:id` | Delete a webhook | `admin:all` |
| POST | `/settings/webhooks/:id/test` | Send test payload | `admin:all` |

---

## Health & Monitoring

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Full health check | No |
| GET | `/health/live` | Kubernetes liveness probe | No |
| GET | `/health/ready` | Kubernetes readiness probe | No |
| GET | `/metrics` | Prometheus metrics | No |
| GET | `/metrics/json` | JSON metrics | No |
| GET | `/metrics/system` | System metrics (CPU, memory) | No |

---

## Error Responses

All endpoints follow a standard error format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (success) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 20 | Items per page (max 100) |

### Paginated Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Rate Limiting

API requests are rate-limited. Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets
