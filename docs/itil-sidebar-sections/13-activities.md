# Activities

ITIL practices: Monitoring and Event Management, Continual Improvement support.

## Navigation Structure

- Route: `/activities`
- Secondary tabs: All Events, Operational Events, Security Events, Admin Events, Integrations
- Detail tabs: Event Detail, Correlation, Related Records, Audit

## Menus

- Header menu:
  - Live/pause stream
  - Date range selector
  - Event class presets
  - Export event log
- Row action menu:
  - Open source record
  - Copy correlation ID
  - Flag for investigation
  - Create incident/task
- Bulk action menu:
  - Bulk export
  - Bulk tag
  - Bulk assign investigation
- Detail action menu:
  - Link to incident/problem
  - Add analyst note
  - Share event bundle

## Required UI Elements

- Unified event feed with actor, action, object, outcome, timestamp.
- Correlation grouping by transaction/session ID.
- Advanced filters by module, team, actor, event type.
- Deep links to originating records.

## Required Features

- Near real-time updates with staleness indicator.
- Noise reduction/grouping for duplicate low-value events.
- Investigative handoff workflow (flag -> assign -> resolve).

## KPIs

- Event-to-incident conversion rate, mean triage time, noisy event ratio.
