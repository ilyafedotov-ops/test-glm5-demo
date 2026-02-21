# Workflows

ITIL practices: Value Stream Orchestration, Continual Improvement.

## Navigation Structure

- Queue route: `/workflows`
- Detail route: `/workflows/[id]`
- Secondary tabs: Active, Waiting Approval, Failed, Completed, Templates
- Detail tabs: Overview, Steps, Inputs/Outputs, Exceptions, Metrics, Audit

## Menus

- Header menu:
  - Start workflow
  - Start from template
  - Import template
  - Export workflow report
- Row action menu:
  - Open workflow
  - Reassign owner
  - Pause/resume
  - Retry failed step
  - Cancel instance
- Bulk action menu:
  - Bulk pause/resume
  - Bulk owner assignment
  - Bulk archive completed
  - Bulk export
- Detail action menu:
  - Add manual step output
  - Approve/reject step
  - Skip step with reason
  - Trigger rollback path

## Required UI Elements

- Workflow queue with template, current step, elapsed time, owner, linked record.
- Step timeline with status badges and SLA timers.
- Step detail panel with input/output payloads.
- Exception handling panel (errors, retries, overrides).
- Linked entity panel (incident/request/change/task).

## Required Features

- Template-based orchestration for incident/change/request scenarios.
- Conditional and parallel step support.
- Blocking rules preventing parent closure if mandatory steps are pending.
- End-to-end audit trail for every step decision.

## KPIs

- Workflow cycle time, step failure rate, retry rate, automation coverage.
