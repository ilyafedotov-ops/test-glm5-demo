# ITIL Service Desk Consolidation Plan

## Objective
Deliver a fully working ITIL-based service desk system with no missing critical capabilities and reduced redundancy across backend, frontend, and shared packages.

## Scope
- Consolidate duplicated modules, contracts, and service ownership.
- Close backend/frontend parity gaps.
- Implement missing ITIL core capabilities.
- Improve production-readiness (authorization, monitoring, queueing, tests).

## Guiding Principles
- Single source of truth for domain contracts and enums.
- Every backend feature must have a usable UI flow when user-facing.
- No placeholder/TODO runtime paths in critical workflows.
- Ship in phased increments with build verification per phase.

## Current High-Risk Gaps (Baseline)
1. Service Catalog request flow is incomplete in UI.
2. CMDB/configuration items are modeled as free-form IDs without a CMDB entity.
3. RBAC authorization guard layer is missing (auth only).
4. Monitoring module exists but is not wired into runtime app module.
5. Queue/worker architecture is incomplete (partial processors, no worker app runtime).
6. Notification preference models are duplicated and inconsistent.
7. Status/type contracts diverge across API, web, and shared contracts.
8. Minimal/no automated tests.

## Phase Plan

### Phase 1: Immediate Stabilization (done)
- [x] Save this plan and track execution status.
- [x] Service Catalog parity:
  - [x] Fix API/UI response shape mismatch for catalog items.
  - [x] Implement submit request UI action (`POST /service-catalog/requests`).
  - [x] Add reject/deny service request backend action for approval flow completeness.
- [x] Runtime observability:
  - [x] Wire `MonitoringModule` into `AppModule`.
  - [x] Ensure monitoring lifecycle init/shutdown runs automatically.
- [x] Admin UI parity:
  - [x] Make organization settings editable and save via `PATCH /organizations/me`.
- [x] Consolidation quick win:
  - [x] Remove duplicate `TicketsService` provider ownership from `SLAModule`.

### Phase 2: ITIL Feature Completion (in progress)
- [ ] CMDB foundation:
  - [x] Add `ConfigurationItem` model and incident-to-CI relation.
  - [x] Add CI CRUD APIs and CI selection in incident UI.
- [x] Request fulfillment lifecycle:
  - [x] Add request inbox/list/detail UI.
  - [x] Add approve/reject/fulfill controls in UI.
  - [x] Add approval history and request transition audit fields.
- [ ] Change enablement hardening:
  - [ ] Configure required approvers/CAB logic per change type.
  - [ ] Enforce approval policy before implementation.

### Phase 3: Governance & Security
- [x] Add permission-based authorization guard/decorators and enforce by endpoint.
  - [x] Add `PermissionsGuard` + `RequirePermissions` primitives.
  - [x] Enforce on incidents/policies/reports/admin controllers.
  - [x] Expand fine-grained permissions to remaining JWT-only domain controllers (auth endpoints excluded).
  - [x] Seed full ITIL permission catalog and non-admin role mappings (`operator`, `compliance_manager`, `analyst`).
- [x] Unify notification preferences into one model and one endpoint contract.
- [x] Apply audit decorators on mutating endpoints and verify log completeness (all mutation controllers except auth login/refresh/logout).

### Phase 4: Architecture Consolidation
- [ ] Centralize enums/types in `@nexusops/contracts` and adopt across API/web.
- [ ] Remove dead frontend modules/components.
- [ ] Resolve duplicated user/admin management overlap.
- [ ] Decide queue strategy:
  - [ ] Either complete dedicated `apps/worker` runtime and enqueue paths,
  - [ ] Or simplify and remove unfinished queue abstractions.

### Phase 5: Quality & Release Readiness
- [ ] Add unit tests for critical services (incidents, catalog, authz, settings).
- [ ] Add integration tests for key API workflows.
  - [x] Add integration audit sweep for notifications endpoints to verify `@Audited` writes to `auditLog`.
- [ ] Add UI smoke/e2e tests for incident and request flows.
- [ ] Add contract tests to prevent API/UI drift.

## UI/Backend Parity Matrix

### Service Catalog
- Backend: create/list/get item, create/list/get request, approve, fulfill.
- UI: list items exists; request submission and request lifecycle UI incomplete.
- Planned: complete submit + lifecycle actions and views.

### Organization Settings
- Backend: get/update organization exists.
- UI: fields rendered, save action not wired.
- Planned: editable form state + save/cancel behavior.

### Monitoring
- Backend: health/metrics controllers exist.
- UI: no monitoring view.
- Planned: wire backend runtime now; add monitoring UI in later phase.

### Notifications Preferences
- Backend: duplicated settings/preferences models.
- UI: settings page uses one model; notifications service uses another.
- Planned: normalize schema and API contract.

## Execution Order
1. Phase 1 stabilization changes.
2. Build verification (`@nexusops/api`, `@nexusops/web`).
3. Phase 2 CMDB + request lifecycle completion.
4. Security/governance layers.
5. Consolidation cleanup and test expansion.

## Risks
- Contract normalization may require coordinated refactors in API and web.
- CMDB introduction requires schema migration and data backfill strategy.
- Authorization rollout may break existing implicit access paths.

## Tracking
- Status values: `todo`, `in_progress`, `done`.
- Update this document at the end of each implementation batch.
