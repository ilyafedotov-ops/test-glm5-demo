# CMDB (Configuration Items)

ITIL practice: Service Configuration Management.

## Navigation Structure

- Registry route: `/configuration-items`
- Secondary tabs: All CIs, Services, Infrastructure, Applications, Retired
- Detail tabs: Summary, Relationships, Linked Records, Change History, Audit

## Menus

- Header menu:
  - New CI
  - Import CIs
  - Sync discovery source
  - Export CMDB
- Row action menu:
  - Open CI
  - Edit attributes
  - Change lifecycle status
  - Link/unlink service
  - Archive/retire
- Bulk action menu:
  - Bulk owner/team assignment
  - Bulk lifecycle update
  - Bulk tag/environment update
  - Bulk export
- Detail action menu:
  - Add relationship
  - Run impact analysis
  - Link incident/change/problem/request
  - Add audit note

## Required UI Elements

- CI registry table: name, class/type, status, criticality, environment, owner, mapped service.
- CI detail panel with lifecycle and support model.
- Relationship graph (depends-on/hosts/connected-to).
- Linked records panel across all ITSM modules.
- Impact map preview for planned changes.

## Required Features

- Relationship validation rules and dependency integrity checks.
- CI lifecycle governance with audit trail.
- Discovery/import reconciliation workflows.
- Impact analysis integration into change approvals.

## KPIs

- CI data completeness, stale CI ratio, mapping coverage, relationship accuracy.
