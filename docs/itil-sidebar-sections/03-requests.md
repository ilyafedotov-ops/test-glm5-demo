# Requests (Service Catalog)

ITIL practices: Service Request Management, Service Catalog Management.

## Navigation Structure

- Catalog route: `/catalog`
- Request inbox route: `/catalog/requests`
- Secondary tabs: Catalog, My Requests, Approval Queue, Fulfillment Queue, Closed
- Detail tabs: Summary, Approval, Fulfillment, Tasks, Timeline, Audit

## Menus

- Catalog header menu:
  - New catalog item (admin)
  - Import catalog items
  - Category filter presets
  - Export catalog
- Request row action menu:
  - Open request
  - Approve/reject
  - Assign fulfiller
  - Mark fulfilled
  - Link CI
  - Cancel request
- Bulk action menu:
  - Bulk approve/reject
  - Bulk assign
  - Bulk due date update
  - Bulk export
- Detail action menu:
  - Add approval note
  - Add fulfillment evidence
  - Trigger follow-up task
  - Notify requester

## Required UI Elements

- Catalog cards with item name, category, SLA target, approval requirement, entitlement notes.
- Request form fields: requester, business justification, urgency, due date, attachments.
- Inbox table: number, item, requester, status, approver, fulfiller, SLA.
- Approval panel with decision history and reason.
- Fulfillment checklist with completion evidence.
- Relationship panel for linked tasks/CIs/incidents.

## Required Features

- Multi-level approval workflows by risk/cost.
- Entitlement validation before submission.
- Auto-assignment by category/service team.
- Fulfillment task templates.
- Requester notifications at every lifecycle stage.

## KPIs

- Fulfillment cycle time, approval turnaround time, rejection rate, SLA compliance.
