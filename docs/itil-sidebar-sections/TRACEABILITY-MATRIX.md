# ITIL 4 Traceability Matrix and Gap Backlog

Review date: 2026-02-15  
Code scope: `apps/web/src/app/**/page.tsx`, `apps/web/src/components/app-shell.tsx`, `apps/web/src/config/navigation.ts`

Status legend:
- `implemented`: present and usable in current UI flow
- `partial`: partially present, missing fields/flows/automation
- `missing`: not present in current implementation

## 1) Dashboard

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| KPI cards (incident/SLA core) | Service Level Management | partial | `apps/web/src/app/dashboard/page.tsx` |
| SLA target and improvement widgets | Continual Improvement | implemented | `apps/web/src/app/dashboard/page.tsx` |
| Quick actions | Service Request/Incident Enablement | implemented | `apps/web/src/app/dashboard/page.tsx` |
| Major incident strip | Incident Management | missing | `apps/web/src/app/dashboard/page.tsx` |
| Top-risk services table | Risk Management | missing | `apps/web/src/app/dashboard/page.tsx` |

Missing to add:
- UI: major incident strip, top-risk services table, backlog aging widget.
- Frontend: widget configuration/state persistence and richer drill-down routing.
- Backend: major incident aggregated endpoint, service risk scoring endpoint.

## 2) Incidents

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Queue with status/priority/impact/urgency/SLA | Incident Management | implemented | `apps/web/src/app/incidents/page.tsx` |
| Advanced filters + major incident filter | Incident Management | implemented | `apps/web/src/app/incidents/page.tsx` |
| Priority matrix in create flow | Incident Management | implemented | `apps/web/src/app/incidents/page.tsx` |
| Detail timeline + linked records | Incident/Knowledge/Problem linkage | implemented | `apps/web/src/app/incidents/page.tsx`, `apps/web/src/app/incidents/[id]/page.tsx` |
| Duplicate detection/merge assistant | Incident Management | missing | `apps/web/src/app/incidents/page.tsx` |

Missing to add:
- UI: duplicate detection panel, merge flow UI, escalation policy visibility.
- Frontend: duplicate candidate fetching, merge action dialogs, escalation wizard.
- Backend: duplicate similarity API, merge incidents endpoint, escalation rule engine APIs.

## 3) Requests (Catalog)

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Catalog cards + approval badge | Service Catalog Management | implemented | `apps/web/src/app/catalog/page.tsx` |
| Request create form with justification | Service Request Management | partial | `apps/web/src/app/catalog/page.tsx` |
| Request inbox + lifecycle actions | Service Request Management | implemented | `apps/web/src/app/catalog/requests/page.tsx` |
| Fulfillment checklist/evidence | Service Request Fulfillment | partial | `apps/web/src/app/catalog/requests/page.tsx` |
| Entitlement validation UI | Service Catalog Governance | missing | `apps/web/src/app/catalog/page.tsx` |

Missing to add:
- UI: urgency, due date, attachments, entitlement hints, fulfillment checklist.
- Frontend: form fields + validation, upload component, checklist component.
- Backend: entitlement evaluation API, attachment upload/storage, checklist persistence.

## 4) Problems

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Problem queue with linked incident counts | Problem Management | implemented | `apps/web/src/app/problems/page.tsx` |
| RCA panel/root cause + workaround fields | Problem Management | implemented | `apps/web/src/app/problems/[id]/page.tsx` |
| Known error marker | Problem Management | partial | `apps/web/src/app/problems/page.tsx` |
| Known Error publication panel | Knowledge/Problem Management | missing | `apps/web/src/app/problems/[id]/page.tsx` |
| Risk/residual risk scoring | Risk Management | missing | `apps/web/src/app/problems/[id]/page.tsx` |

Missing to add:
- UI: explicit KEDB publication workflow, residual risk scoring block.
- Frontend: known error lifecycle controls, risk score visualization.
- Backend: KEDB status model, risk/residual fields and analytics endpoints.

## 5) Changes

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Change queue (type/risk/window/approvals) | Change Enablement | implemented | `apps/web/src/app/changes/page.tsx` |
| Approval board/actions | Change Enablement | implemented | `apps/web/src/app/changes/[id]/page.tsx` |
| Risk + rollback/test fields | Change Enablement | partial | `apps/web/src/app/changes/[id]/page.tsx` |
| PIR section | Continual Improvement | missing | `apps/web/src/app/changes/[id]/page.tsx` |
| Change calendar conflict UI | Change Scheduling | partial | `apps/web/src/app/changes/page.tsx` |

Missing to add:
- UI: PIR tab, risk matrix (likelihood/blast radius), calendar conflict view.
- Frontend: PIR forms/workflow, pre-implementation gate checks, calendar views.
- Backend: conflict detection API, PIR schema, enforced approval gates.

## 6) Tasks

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Task board/list with due + SLA indicators | Work Coordination | implemented | `apps/web/src/app/tasks/page.tsx` |
| Linked record panel | Value Stream Integration | implemented | `apps/web/src/app/tasks/page.tsx` |
| Time tracking (estimate/actual) | Measurement & Reporting | implemented | `apps/web/src/app/tasks/page.tsx` |
| Blocker explicit flagging | Work Management | partial | `apps/web/src/app/tasks/page.tsx` |
| Closure quality gate | Work Management | partial | `apps/web/src/app/tasks/page.tsx` |

Missing to add:
- UI: blocker field, completion checklist/verification section.
- Frontend: blocker workflows, mandatory closure validations.
- Backend: blocker state model, closure validation rules and audit events.

## 7) Workflows

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Workflow queue with step progress | Value Stream Orchestration | implemented | `apps/web/src/app/workflows/page.tsx` |
| Step timeline/actions | Workflow Management | implemented | `apps/web/src/app/workflows/[id]/page.tsx` |
| Rollback/approve/cancel actions | Change/Incident Flow Control | implemented | `apps/web/src/app/workflows/[id]/page.tsx` |
| Dedicated exception panel | Monitoring & Event Management | partial | `apps/web/src/app/workflows/[id]/page.tsx` |
| Template library management UI | Continual Improvement | partial | `apps/web/src/app/workflows/page.tsx` |

Missing to add:
- UI: explicit error/exception tab, template governance UI.
- Frontend: step retry analytics, SLA per-step widgets.
- Backend: per-step SLA metrics API, template versioning endpoints.

## 8) Knowledge

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Search + filters + article list | Knowledge Management | implemented | `apps/web/src/app/knowledge/page.tsx` |
| Create/edit article flow | Knowledge Management | partial | `apps/web/src/app/knowledge/new/page.tsx` |
| Helpful/not-helpful feedback | Continual Improvement | implemented | `apps/web/src/app/knowledge/[id]/page.tsx` |
| Metadata richness (service/CI/audience/review) | Knowledge Governance | partial | `apps/web/src/app/knowledge/[id]/page.tsx` |
| Version history/diff | Knowledge Governance | missing | `apps/web/src/app/knowledge/[id]/page.tsx` |

Missing to add:
- UI: rich editor templates, version history tab, review/expiry management.
- Frontend: diff viewer, metadata editor, review reminders UI.
- Backend: article versioning model, revision diff endpoint, review scheduler.

## 9) CMDB

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| CI list with core attributes | Service Configuration Management | partial | `apps/web/src/app/configuration-items/page.tsx` |
| CI detail view | Service Configuration Management | missing | `apps/web/src/app/configuration-items/page.tsx` |
| Relationship graph | Configuration Control | missing | `apps/web/src/app/configuration-items/page.tsx` |
| Linked records panel | Impact Analysis | missing | `apps/web/src/app/configuration-items/page.tsx` |
| Impact analysis preview | Change Enablement | missing | `apps/web/src/app/configuration-items/page.tsx` |

Missing to add:
- UI: CI details drawer/page, relationship map, linked record section.
- Frontend: graph rendering, CI detail routing, impact preview widgets.
- Backend: CI relationship APIs, impact traversal endpoint, relationship integrity checks.

## 10) Compliance

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Policy register + version/status | Governance | implemented | `apps/web/src/app/compliance/page.tsx` |
| Policy detail ownership/review fields | Governance | implemented | `apps/web/src/app/compliance/[id]/page.tsx` |
| Scorecards/status matrix | Risk Management | partial | `apps/web/src/app/compliance/page.tsx` |
| Exception register | Risk Treatment | missing | `apps/web/src/app/compliance/page.tsx` |
| Control attestation workflow | Information Security Management | partial | `apps/web/src/app/compliance/[id]/page.tsx` |

Missing to add:
- UI: exception tab, attestation queue, evidence completeness panel.
- Frontend: exception lifecycle actions, attestation forms and reminders.
- Backend: exception entity/workflow, attestation APIs and due-date scheduler.

## 11) Violations

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Violation queue with severity/status/owner | Risk Remediation | implemented | `apps/web/src/app/violations/page.tsx` |
| Remediation notes/action flow | Risk Remediation | implemented | `apps/web/src/app/violations/[id]/page.tsx` |
| Evidence artifacts panel | Governance & Auditability | partial | `apps/web/src/app/violations/[id]/page.tsx` |
| Residual risk scoring | Risk Management | missing | `apps/web/src/app/violations/[id]/page.tsx` |
| Linked incident/change panels | Value Stream Integration | partial | `apps/web/src/app/violations/[id]/page.tsx` |

Missing to add:
- UI: evidence upload/list, residual risk gauge, richer linked-record view.
- Frontend: evidence component, residual-risk form, direct create-incident/change actions.
- Backend: evidence attachment APIs, residual risk fields, cross-link endpoints.

## 12) SLA Dashboard

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| SLA scorecards by priority | Service Level Management | implemented | `apps/web/src/app/sla-dashboard/page.tsx` |
| At-risk + breached queues | Service Level Management | implemented | `apps/web/src/app/sla-dashboard/page.tsx` |
| Trend visualization | Continual Improvement | implemented | `apps/web/src/app/sla-dashboard/page.tsx` |
| Policy/business-hours context | Service Level Governance | missing | `apps/web/src/app/sla-dashboard/page.tsx` |
| Pause/resume reason visibility | Incident/Request SLA handling | missing | `apps/web/src/app/sla-dashboard/page.tsx` |

Missing to add:
- UI: SLA policy reference panel, business-hours context, pause reason badges.
- Frontend: drill-through to policy and ticket pause history.
- Backend: policy lookup endpoint, pause/resume audit query endpoints.

## 13) Activities

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Unified event feed | Monitoring & Event Management | implemented | `apps/web/src/app/activities/page.tsx` |
| Advanced filtering | Monitoring & Event Management | implemented | `apps/web/src/app/activities/page.tsx` |
| Deep links to source records | Value Stream Integration | implemented | `apps/web/src/app/activities/page.tsx` |
| Auto correlation grouping | Problem/Incident Analysis | partial | `apps/web/src/app/activities/page.tsx` |
| Live streaming/staleness indicators | Monitoring | missing | `apps/web/src/app/activities/page.tsx` |

Missing to add:
- UI: live mode toggle, staleness timestamp, correlation clusters.
- Frontend: websocket/poll strategy with live badges.
- Backend: streaming endpoint/websocket channel, correlation grouping service.

## 14) Reports

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Report templates/catalog | Measurement & Reporting | partial | `apps/web/src/app/reports/page.tsx` |
| Parameterized run dialog | Measurement & Reporting | implemented | `apps/web/src/app/reports/page.tsx` |
| Job history + run statuses | Continual Improvement | implemented | `apps/web/src/app/reports/page.tsx` |
| Scheduled delivery management | Measurement & Reporting | missing | `apps/web/src/app/reports/page.tsx` |
| Download center with retention | Governance | missing | `apps/web/src/app/reports/page.tsx` |

Missing to add:
- UI: schedule management tab, recipients list, retention indicators.
- Frontend: cron/schedule editors, recurring job UI, artifact retention badges.
- Backend: scheduled report jobs, recipient delivery pipeline, retention metadata.

## 15) Audit Logs

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Audit event list + context | Governance | implemented | `apps/web/src/app/audit-logs/page.tsx` |
| Field-level diff viewer | Change Control | implemented | `apps/web/src/app/audit-logs/page.tsx` |
| Correlation-linked records | Monitoring & Analysis | implemented | `apps/web/src/app/audit-logs/page.tsx` |
| Session/user-agent metadata | Information Security Management | partial | `apps/web/src/app/audit-logs/page.tsx` |
| Retention/archive status | Governance | missing | `apps/web/src/app/audit-logs/page.tsx` |

Missing to add:
- UI: retention class indicator, archive state, security metadata block.
- Frontend: enriched detail panel fields and filter chips.
- Backend: retention policy metadata exposure, archive lifecycle APIs.

## 16) Notifications

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Notification list with read state | Stakeholder Engagement | implemented | `apps/web/src/app/notifications/page.tsx` |
| Header unread badge/dropdown | Stakeholder Engagement | implemented | `apps/web/src/components/app-shell.tsx` |
| Filters by type/unread | Service Desk Communication | partial | `apps/web/src/app/notifications/page.tsx` |
| Delivery status by channel | Service Integration Management | missing | `apps/web/src/app/notifications/page.tsx` |
| Snooze/mute controls | Notification Governance | partial | `apps/web/src/app/notifications/page.tsx` |

Missing to add:
- UI: channel delivery states, snooze/mute controls, critical filter chips.
- Frontend: grouped notifications, digest preview, bulk mute interactions.
- Backend: delivery receipts model, mute/snooze preference APIs.

## 17) Admin

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Users tab with lifecycle actions | Organizations & People | implemented | `apps/web/src/app/admin/page.tsx` |
| Roles & permissions management | Access Management | partial | `apps/web/src/app/admin/page.tsx` |
| Teams management | Organizations & People | implemented | `apps/web/src/app/admin/page.tsx` |
| Organization defaults panel | Governance | partial | `apps/web/src/app/admin/page.tsx` |
| Admin activity/justification panel | Governance | missing | `apps/web/src/app/admin/page.tsx` |

Missing to add:
- UI: permission matrix visualization, privileged-change approval panel, CAB admin tab.
- Frontend: access review workflows, role-change approval dialogs.
- Backend: approval workflow for privileged changes, CAB config APIs, access review jobs.

## 18) Settings

| UI Item | ITIL 4 Practice | Status | Evidence |
|---|---|---|---|
| Notification preferences toggles | Stakeholder Engagement | partial | `apps/web/src/app/settings/page.tsx` |
| Webhook registry + edit/delete/test | Service Integration Management | implemented | `apps/web/src/app/settings/page.tsx` |
| Quiet hours/digest scheduling | Stakeholder Engagement | missing | `apps/web/src/app/settings/page.tsx` |
| Retry/backoff/timeout configuration | Service Integration Management | partial | `apps/web/src/app/settings/page.tsx` |
| Detailed webhook test result panel | Service Integration Management | partial | `apps/web/src/app/settings/page.tsx` |

Missing to add:
- UI: preference matrix (event x channel x priority), quiet-hours, digest schedule, webhook retry policy controls.
- Frontend: matrix editor, retry policy forms, persistent test-result view.
- Backend: preference inheritance model, webhook retry/backoff config persistence, webhook test diagnostics endpoint.

---

## Cross-Section Prioritized Backlog

1. P1: CMDB relationship model + UI, Incident duplicate detection/merge, Change PIR flow, Compliance exceptions.
2. P1: Scheduled Reports + retention, Notification delivery receipts, Settings quiet-hours/digest.
3. P2: Dashboard major-incident strip and service-risk scoring, Workflow exception analytics, Knowledge versioning.
4. P2: Admin privileged-access approval workflows and CAB governance UI.
