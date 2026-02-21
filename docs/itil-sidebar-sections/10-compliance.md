# Compliance

ITIL practices: Risk Management, Information Security Management, Governance.

## Navigation Structure

- Policy route: `/compliance`
- Policy detail route: `/compliance/[id]`
- Secondary tabs: Policies, Controls, Exceptions, Evidence, Risk Scorecards
- Detail tabs: Policy, Controls, Violations, Exceptions, Evidence, Audit

## Menus

- Header menu:
  - New policy
  - Import policy/control set
  - Run compliance assessment
  - Export evidence pack
- Row action menu:
  - Open policy
  - Edit status/version
  - Assign owner
  - Start review
  - Retire policy
- Bulk action menu:
  - Bulk owner assignment
  - Bulk lifecycle transition
  - Bulk category/domain update
  - Bulk export
- Detail action menu:
  - Add control
  - Request attestation
  - Raise exception
  - Create remediation task

## Required UI Elements

- Policy register with version and effective dates.
- Control mapping panel with control owner and attestation due dates.
- Exception register with expiry/renewal state.
- Evidence repository links and completeness status.
- Compliance scorecards by domain/service/team.

## Required Features

- Policy lifecycle workflow (draft/review/approved/active/retired).
- Control attestation workflows with reminders/escalations.
- Automated violation generation from failed controls.
- Exception approval and renewal governance.

## KPIs

- Control pass rate, attestation on-time rate, exception aging, remediation SLA.
