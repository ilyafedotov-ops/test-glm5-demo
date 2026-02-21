# Dashboard

ITIL practices: Service Level Management, Continual Improvement, Monitoring and Event Management.

## Navigation Structure

- Primary route: `/dashboard`
- Secondary tabs: Overview, Operations, SLA, Risk, Improvement Backlog
- Drill-down links: incidents/problems/changes/tasks/violations/reports

## Menus

- Header menu:
  - Refresh data
  - Date range selector
  - Scope selector (organization/team/service)
  - Save personal layout
  - Export snapshot
- Widget menu:
  - Configure widget
  - Change visualization type
  - Hide/show widget
  - Drill to source queue
- Global quick action menu:
  - Create incident
  - Create problem
  - Create change
  - Create request
  - Create task

## Required UI Elements

- KPI cards: open incidents, MTTR, backlog age, change success rate, SLA attainment.
- Major incident strip: active MI count, commander, bridge status, affected services.
- SLA health chart: met/at-risk/breached by priority and service.
- Operational trend charts: created vs resolved incidents, change volume, request throughput.
- Top-risk services table: service, breach risk, major incident count, owner.
- Activity timeline: high-impact events and transitions.
- Improvement widget: recurring issues, linked problem candidates, CSI actions.

## Required Features

- Real-time or scheduled refresh with staleness indicator.
- Drill-down from every metric to filtered queue.
- Role-based dashboard presets.
- Personal dashboard layout persistence.
- Week-over-week and month-over-month comparisons.

## KPIs

- MTTR, MTTA, SLA response %, SLA resolution %, change success %, request fulfillment time.
