# Admin

ITIL practices: Organizations and People, Access Management, Governance.

## Navigation Structure

- Route: `/admin`
- Implemented tabs: Users, Roles and Permissions, Teams, Organization
- Recommended additional tabs: CAB, Access Reviews, Integration Governance

## Menus

- Header menu:
  - Create user/role/team
  - Import users/teams
  - Run access review
  - Export admin registry
- Row action menu (user):
  - Edit profile
  - Activate/deactivate
  - Reset credentials
  - Assign roles/teams
  - View audit trail
- Row action menu (role/team):
  - Edit permissions/members
  - Clone
  - Retire/delete
- Bulk action menu:
  - Bulk activation/deactivation
  - Bulk role assignment
  - Bulk team assignment
  - Bulk export
- Detail action menu:
  - Submit privileged change for approval
  - Add governance note
  - Open related audit events

## Required UI Elements

- User lifecycle table with state, role, team, last access.
- Permission matrix by resource x action.
- Team structure panel with lead and escalation contacts.
- Organization policy panel (security defaults, SLA defaults, governance toggles).
- Admin activity history and justification notes.

## Required Features

- Segregation-of-duties guardrails.
- Approval workflow for privileged role changes.
- CAB membership and approval policy administration.
- Access certification campaigns (periodic reviews).

## KPIs

- Privileged access change lead time, access review completion rate, policy drift count.
