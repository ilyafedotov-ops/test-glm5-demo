# Problems

ITIL practice: Problem Management.

## Navigation Structure

- Primary route: `/problems`
- Detail route: `/problems/[id]`
- Secondary tabs: Open, Investigating, Known Errors, Pending Change, Closed
- Detail tabs: Summary, RCA, Known Error, Linked Incidents, Linked Changes, Audit

## Menus

- Header menu:
  - New problem
  - Create from incident pattern
  - Export problem register
  - Saved RCA views
- Row action menu:
  - Open problem
  - Assign investigator
  - Mark known error
  - Link change
  - Close/reopen
- Bulk action menu:
  - Bulk assign
  - Bulk status update
  - Bulk categorization
  - Bulk export
- Detail action menu:
  - Add RCA artifact
  - Publish workaround
  - Trigger permanent-fix change
  - Start PIR

## Required UI Elements

- Problem queue with recurrence indicators and linked incident counts.
- RCA workspace (5-Whys/Fishbone/finding log).
- Known error panel with workaround publication status.
- Risk and residual risk scoring.
- Linked incident cluster view by service/CI/symptom.

## Required Features

- Candidate problem detection from recurring incidents.
- Promotion to Known Error Database (KEDB).
- Permanent fix linkage to changes and post-change validation.
- Mandatory PIR before closure for high-impact problems.

## KPIs

- Recurrence reduction, time to root cause, known error reuse rate.
