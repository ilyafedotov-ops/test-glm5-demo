# Tasks

ITIL practice: Work Coordination across Incident/Problem/Change/Request.

## Navigation Structure

- Queue route: `/tasks`
- Detail route: `/tasks/[id]`
- Secondary tabs: My Tasks, Team Tasks, Overdue, Blocked, Completed
- Detail tabs: Summary, Checklist, Time Log, Dependencies, Timeline, Audit

## Menus

- Header menu:
  - New task
  - Task templates
  - Import/export tasks
  - Saved task views
- Row action menu:
  - Open task
  - Assign/reassign
  - Change status
  - Link record
  - Set due date
- Bulk action menu:
  - Bulk assign
  - Bulk due date shift
  - Bulk priority update
  - Bulk close
- Detail action menu:
  - Add checklist item
  - Log effort
  - Add blocker
  - Escalate overdue

## Required UI Elements

- Queue table with source entity, status, priority, assignee, due date, SLA state.
- Dependency graph for predecessor/successor tasks.
- Time tracking block (estimated vs actual effort).
- Blockers and risk flags.
- Linked record panel (incident/problem/change/workflow/violation).

## Required Features

- Template-driven task creation by process.
- Overdue automation (alerts/escalations).
- Mandatory completion notes for closure.
- Bulk operations for daily queue management.

## KPIs

- Task throughput, overdue rate, average completion time, blocker resolution time.
