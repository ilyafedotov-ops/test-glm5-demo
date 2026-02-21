# Violations

ITIL practices: Risk Remediation, Continual Improvement.

## Navigation Structure

- Queue route: `/violations`
- Detail route: `/violations/[id]`
- Secondary tabs: Open, High/Critical, In Remediation, Overdue, Closed
- Detail tabs: Summary, Evidence, Remediation Plan, Linked Records, Timeline, Audit

## Menus

- Header menu:
  - New violation
  - Import findings
  - Severity presets
  - Export remediation register
- Row action menu:
  - Open violation
  - Assign owner
  - Change status
  - Create remediation task/change
  - Raise exception
- Bulk action menu:
  - Bulk assign
  - Bulk severity update
  - Bulk status update
  - Bulk export
- Detail action menu:
  - Add evidence
  - Approve remediation plan
  - Escalate overdue
  - Close with validation

## Required UI Elements

- Queue table: severity, policy/control, affected entity, owner, due date, status, SLA state.
- Evidence panel with artifact links and validation state.
- Remediation plan block with tasks and milestone dates.
- Risk and residual risk scoring.
- Linked incident/change/exception panels.

## Required Features

- SLA targets by severity and auto-escalation rules.
- Direct task/change generation from violations.
- Closure gate requiring evidence verification.
- Trend analysis by policy, owner team, and cause category.

## KPIs

- Mean time to remediate, overdue critical count, recurrence rate.
