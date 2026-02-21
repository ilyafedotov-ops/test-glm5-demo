# Knowledge

ITIL practice: Knowledge Management.

## Navigation Structure

- List route: `/knowledge`
- Create route: `/knowledge/new`
- Detail route: `/knowledge/[id]`
- Secondary tabs: All, Drafts, Published, Needs Review, Known Errors
- Detail tabs: Article, Metadata, Related Records, Feedback, Versions, Audit

## Menus

- Header menu:
  - New article
  - Import article
  - Publish queue
  - Export knowledge report
- Row action menu:
  - Open article
  - Edit metadata
  - Publish/unpublish
  - Set review date
  - Archive
- Bulk action menu:
  - Bulk publish
  - Bulk category/tag update
  - Bulk review date set
  - Bulk archive/export
- Detail action menu:
  - Link incident/problem/change
  - Add known-error flag
  - Compare version
  - Request review

## Required UI Elements

- Search-first article list with filters (status, category, service, CI, author, review date).
- Rich editor with templates (runbook, SOP, troubleshooting, FAQ).
- Metadata panel (services, CIs, tags, audience, validity window).
- Feedback panel (helpful/not helpful, comments).
- Version history and diff view.
- Usage analytics panel (views, ticket reuse, deflection signal).

## Required Features

- One-click knowledge capture from incident/problem resolution.
- Review and expiration reminders.
- Approval workflow before publication (for controlled content).
- Suggested article recommendations during ticket handling.

## KPIs

- Reuse rate, helpful score, review compliance, incident deflection impact.
