# Audit Logs

ITIL practices: Governance, Information Security Management.

## Navigation Structure

- Route: `/audit-logs`
- Secondary tabs: All, Access, Data Changes, Privileged Actions, Integrations
- Detail tabs: Event, Diff, Metadata, Correlation, Retention

## Menus

- Header menu:
  - Query presets
  - Retention scope filter
  - Export audit slice
  - Integrity check view
- Row action menu:
  - Open event
  - View diff
  - Copy audit reference
  - Link to source record
- Bulk action menu:
  - Bulk export
  - Bulk legal hold tag
  - Bulk investigation bundle
- Detail action menu:
  - Compare with related event
  - Share investigation package
  - Add investigator note

## Required UI Elements

- Immutable event table: actor, action, target, time, IP, correlation ID, outcome.
- Diff viewer for updated fields.
- Metadata panel (session, user agent, source system, retention class).
- Correlation panel for related events.
- Retention/archival status indicator.

## Required Features

- Tamper-evident event storage and traceability.
- Full-text and structured queries.
- Controlled export with authorization checks.
- Alerting hooks for suspicious privileged activity.

## KPIs

- Privileged change visibility, audit query latency, suspicious event detection rate.
