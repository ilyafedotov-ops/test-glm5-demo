# SLA Dashboard

ITIL practice: Service Level Management.

## Navigation Structure

- Route: `/sla-dashboard`
- Secondary tabs: Overview, Response SLA, Resolution SLA, At Risk, Breaches, Trends
- Drill-down links: incidents/tasks/requests by SLA state

## Menus

- Header menu:
  - Time window selector
  - Service/team scope selector
  - SLA policy selector
  - Export SLA pack
- List widget menu:
  - View breached records
  - View at-risk records
  - Change chart granularity
- Detail action menu (from drill-down):
  - Open record
  - Escalate owner
  - Add SLA pause reason

## Required UI Elements

- SLA scorecards by priority and service.
- At-risk queue with countdown timers.
- Breached queue with breach duration.
- Trend charts for response/resolution attainment.
- Policy and business-hours context panel.
- Pause/resume reason visibility.

## Required Features

- Configurable SLA policy catalog and threshold visualization.
- Breach prediction and proactive alerting.
- Deep links to violating records.
- Scheduled SLA report distribution.

## KPIs

- SLA attainment %, predicted breach count, breach volume, breach aging.
