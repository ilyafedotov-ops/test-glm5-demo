# Changes

ITIL practice: Change Enablement.

## Navigation Structure

- Queue route: `/changes`
- Create route: `/changes/new`
- Detail route: `/changes/[id]`
- Secondary tabs: Calendar, Queue, CAB Pending, Emergency, Completed
- Detail tabs: Summary, Risk, Approvals, Implementation, PIR, Audit

## Menus

- Header menu:
  - New change
  - Open change calendar
  - CAB agenda view
  - Export schedule
- Row action menu:
  - Open change
  - Submit for approval
  - Add approver
  - Reschedule window
  - Cancel/reject
- Bulk action menu:
  - Bulk schedule update
  - Bulk approver assignment
  - Bulk categorization (standard/normal/emergency)
  - Bulk export
- Detail action menu:
  - Add risk assessment
  - Start implementation
  - Trigger rollback
  - Complete and start PIR

## Required UI Elements

- Change type selector (standard/normal/emergency).
- Risk matrix with impact, likelihood, blast radius, rollback readiness.
- Approval board showing required/optional approvers and status.
- Window planner with blackout conflict detection.
- Affected CI/service impact map.
- Implementation checklist and evidence attachments.
- PIR section for outcome and lessons learned.

## Required Features

- Policy-driven approval enforcement by type and risk.
- Pre-implementation gating (approvals + test evidence + rollback plan).
- Emergency fast track with mandatory retrospective.
- Change collision detection and dependency alerts.

## KPIs

- Change success rate, emergency ratio, failed change rate, approval lead time.
