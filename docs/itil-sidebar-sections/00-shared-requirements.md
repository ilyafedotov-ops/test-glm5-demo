# Shared Requirements

## Scope

- Source of sidebar sections: `apps/web/src/config/navigation.ts`
- Source of implemented route subsections: `apps/web/src/app/**/page.tsx`
- Audience: Product, UX, Engineering, QA, Service Operations

## Global Navigation Standard

Every sidebar module must define these navigation layers:

- Primary: sidebar item (module entry)
- Secondary: section tabs or route-level subpages
- Tertiary: detail tabs inside record pages/drawers
- Contextual: row action menus and bulk action menus

## Global Menu Taxonomy (Required In Every Module)

- Header menu: create/import/export/configure/view controls
- Filter menu: saved views, advanced filters, quick presets
- Row action menu: open, edit, assign, link records, transition, delete/archive
- Bulk action menu: assign, state transition, priority/classification change, export
- Detail action menu: timeline note, attachment, escalation, approval, close/reopen

## Global UI Baseline

- Standard page regions: header, KPI strip, filter/search bar, list/grid, detail panel
- Data tables: sortable columns, column chooser, pin/freeze, resize, density modes
- Forms: inline validation, required markers, helper text, draft save
- Timeline/activity panel: actor, timestamp, action, payload delta, correlation ID
- Relationship panel: linked incidents/problems/changes/tasks/knowledge/CIs
- Notification hooks: in-app, email, webhook event mapping

## Global Feature Baseline

- Role-based visibility and permission-guarded actions
- Full audit logging for all create/update/transition/delete operations
- SLA context on list and detail levels (at-risk, breached, paused)
- Assignment and escalation model (owner, team, escalation reason)
- Saved views and exports (CSV/JSON; PDF optional)
- Keyboard accessibility and responsive behavior

## Common Data & Metadata Fields

- `id`, `number`, `title/name`, `status`, `priority/severity`, `owner`, `team`
- `createdAt`, `updatedAt`, `dueAt`, `closedAt`
- `service`, `configurationItem`, `category`, `tags`
- `correlationId`, `sourceChannel`, `auditRef`

## Delivery Checklist

- Menus are fully defined for header/filter/row/bulk/detail layers.
- Subsections are mapped to current routes and required future tabs.
- UI elements include list, detail, forms, timeline, and relationship panels.
- Features include automations, approvals, escalations, and integrations.
- KPIs are defined and measurable for each module.
- RBAC and audit controls are explicitly included.
