# Incidents

ITIL practice: Incident Management.

## Navigation Structure

- Primary route: `/incidents`
- Detail route: `/incidents/[id]`
- Secondary tabs (list): All, My Queue, Major, Unassigned, Breached, At Risk
- Detail tabs: Summary, Timeline, Tasks, Linked Records, Communications, Audit

## Menus

- Header menu:
  - New incident
  - Import incidents
  - Export queue
  - Saved views
  - SLA presets
- Row action menu:
  - Open detail
  - Assign/reassign
  - Change status
  - Escalate
  - Link problem/change/CI/knowledge
  - Merge duplicate
- Bulk action menu:
  - Bulk assign
  - Bulk priority update
  - Bulk transition
  - Bulk tag/category update
  - Bulk export
- Detail action menu:
  - Add work note
  - Trigger major incident workflow
  - Start bridge communication
  - Pause/resume SLA
  - Resolve/close/reopen

## Required UI Elements

- Queue columns: number, title, status, priority, impact, urgency, service, CI, assignee, SLA timers.
- Advanced filters: channel, category, team, age, major flag, linked records.
- Priority matrix control (impact x urgency).
- Detail header with badges for SLA state and major incident.
- Timeline with state history, notes, and notification events.
- Resolution panel: workaround, resolution summary, closure code.
- Related records panel: problems, changes, tasks, knowledge articles, CIs.

## Required Features

- Mandatory transition fields by target state.
- Auto-escalation and notifications based on SLA thresholds.
- Duplicate/similar incident detection.
- Major incident process trigger with communication templates.
- Assignment balancing and reassignment reason tracking.

## KPIs

- First response time, MTTR, backlog by priority, major incident count, reopen rate.
