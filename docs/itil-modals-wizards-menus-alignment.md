# ITIL Best Practices Alignment: Modals, Wizards & Menus

This document catalogs every modal (Dialog), wizard, sheet (detail panel), and menu across sidebar sections, and specifies the UI elements and features required for ITIL alignment.

---

## Table of Contents

1. [Global Menus & Command Palette](#1-global-menus--command-palette)
2. [Incidents](#2-incidents)
3. [Requests (Service Catalog)](#3-requests-service-catalog)
4. [Problems](#4-problems)
5. [Changes](#5-changes)
6. [Tasks](#6-tasks)
7. [Workflows](#7-workflows)
8. [Knowledge](#8-knowledge)
9. [CMDB (Configuration Items)](#9-cmdb-configuration-items)
10. [Compliance](#10-compliance)
11. [Violations](#11-violations)
12. [Reports](#12-reports)
13. [Activities](#13-activities)
14. [Settings](#14-settings)
15. [Admin](#15-admin)

---

## 1. Global Menus & Command Palette

### 1.1 Notifications Dropdown Menu (Header)

**Location:** App shell header, bell icon

**Current UI Elements:**
- Dropdown trigger with unread badge
- Label: "Notifications"
- Unread count display
- "View all" action → `/notifications`

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Unread Badge** | Count of unread notifications | Engagement: Draw attention to actionable items |
| **Notification Preview** | Last 3–5 notifications with type, title, timestamp | Service Desk: Quick triage |
| **Mark All Read** | Bulk mark as read (optional in dropdown) | Inbox management |
| **Filter by Type** | Incident, SLA, Change, etc. (optional) | Categorization |
| **Action Link** | Navigate to incident/change/request on click | Traceability |

**Gaps:** Dropdown currently shows placeholder text; add actual notification list preview.

---

### 1.2 User Account Dropdown Menu (Header)

**Location:** App shell header, avatar/name

**Current UI Elements:**
- Profile Settings → `/settings`
- Preferences → `/settings`
- Help & Support → (empty action)
- Sign Out

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Profile Settings** | Link to user profile/preferences | Organizations and People |
| **Notification Preferences** | Quick link to notification settings | Engagement |
| **Help & Support** | Link to knowledge base or support portal | Service Desk |
| **Sign Out** | Clear session | Security |
| **Role Badge** | Display current role(s) in menu | RBAC visibility |

**Gaps:** Help & Support has no action; add link to `/knowledge` or external support URL.

---

### 1.3 Command Palette (Cmd+K / Ctrl+K)

**Location:** Global keyboard shortcut

**Current UI Elements:**
- Search input with fuzzy matching
- Grouped commands (Recent, Navigation, Actions)
- Keyboard navigation (↑↓, Enter, Esc)
- Recent commands persistence

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Create Incident** | Quick create incident | Incident Management |
| **Create Change** | Quick create change | Change Enablement |
| **Create Problem** | Quick create problem | Problem Management |
| **Create Task** | Quick create task | General |
| **Navigate to Sections** | Dashboard, Incidents, SLA, Reports, etc. | Engage |
| **Run Report** | Open report dialog or run predefined report | Continual Improvement |
| **Search Knowledge** | Open knowledge search | Knowledge Management |
| **Theme Toggle** | Dark/light mode | UX |

**Gaps:** Ensure all ITIL-critical create actions and navigation targets are registered in the command palette.

---

## 2. Incidents

### 2.1 Create Incident Modal (Dialog)

**Location:** `/incidents` – "New Incident" button

**Current UI Elements:**
- Title (required)
- Description (required)
- Priority Matrix (Impact × Urgency → Priority)
- Channel (portal, email, phone, chat, api)
- Category (from options)
- Tags (comma-separated)
- Configuration Item selector (multi-select)
- Cancel, Create Incident

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Brief description | Incident Management: Log |
| **Description** | Detailed description | Diagnosis support |
| **Priority Matrix** | Impact × Urgency → Priority | ITIL prioritization |
| **Channel** | Source of report | Multi-channel support |
| **Category** | Hierarchical category | Categorization |
| **Tags** | Free-form tags | Search and grouping |
| **Configuration Items** | Link affected CIs | Service Configuration Management |
| **Contact/Reporter** | Auto-filled from auth; override if different | Traceability |
| **Attachment** | Optional file upload | Evidence (future) |

**Gaps:** Add optional "Link to Problem" if creating from known error context; "Major Incident" checkbox for high-impact events.

---

### 2.2 Incident Transition Modal (Dialog)

**Location:** `/incidents` (sheet) and `/incidents/[id]` – Status transition buttons

**Current UI Elements:**
- Target Status selector
- Pending: Pending Reason, On Hold Until
- Resolved: Resolution Summary
- Closed: Closure Code
- Cancelled: Cancellation Reason
- Transition Comment (optional)
- Cancel, Apply Transition

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Target Status** | Assigned, In Progress, Pending, Resolved, Closed, Escalated, Cancelled | Incident lifecycle |
| **Pending Reason** | Required when → Pending | Document waiting state |
| **On Hold Until** | Optional datetime | SLA hold handling |
| **Resolution Summary** | Required when → Resolved | Knowledge capture |
| **Closure Code** | Required when → Closed | Outcome categorization |
| **Cancellation Reason** | Required when → Cancelled | Audit trail |
| **Comment** | Optional context | Audit trail |
| **Link to Problem** | Optional when resolving | Problem Management |
| **Link to Knowledge Article** | Optional when resolving | Knowledge Management |

**Gaps:** Add "Link to Problem" and "Link to Knowledge Article" fields when transitioning to Resolved/Closed.

---

### 2.3 Incident Detail Sheet (Slide-over Panel)

**Location:** `/incidents` – Click incident row

**Current UI Elements:**
- Ticket number, title, status, priority, channel, impact/urgency
- Description
- SLA indicators (response, resolution)
- Details (created, reporter, team, category, tags, CIs)
- Linked workflows and tasks
- Status transition buttons
- View Full Details → `/incidents/[id]`

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Header** | Ticket, title, status badges | Identification |
| **Description** | Full description | Diagnosis |
| **SLA Indicators** | Response/resolution due, met/breached | SLM |
| **Assignee** | Assigned user | Ownership |
| **Reporter** | Reporting user | Traceability |
| **Team** | Owning team | Escalation path |
| **Configuration Items** | Linked CIs | Impact assessment |
| **Linked Workflows/Tasks** | With navigation | Value stream linkage |
| **Status Transitions** | Quick actions | Lifecycle management |
| **Workaround** | If known error | Problem Management |
| **Related Incidents** | Same CI or symptom | Correlation |

**Gaps:** Add Workaround field; Related Incidents section; Escalate action with escalation path selector.

---

## 3. Requests (Service Catalog)

### 3.1 Request Service Modal (Dialog)

**Location:** `/catalog` – Click catalog item card

**Current UI Elements:**
- Service item name (read-only)
- Description (read-only)
- Approval required notice
- Additional details/justification (textarea)
- Cancel, Submit Request

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Service Item** | Name, description, category | Service Catalog |
| **Approval Required** | Visual indicator | Request Fulfillment |
| **Title** | Auto-generated or editable | Request identification |
| **Description/Justification** | User-provided details | Approval context |
| **Urgency** | Optional: Low, Medium, High | Prioritization |
| **Due Date** | Optional: When needed by | Fulfillment target |
| **Attachments** | Optional files | Evidence (future) |

**Gaps:** Add Urgency and Due Date fields; allow title override for custom requests.

---

### 3.2 Request Detail Sheet (Service Request Inbox)

**Location:** `/catalog/requests` – Click request row

**Current UI Elements:**
- Ticket number, title, status, category
- Description
- Requester, Created, Approved/Denied/Fulfilled (with dates and actors)
- Lifecycle History (transitions)
- **If status=requested:** Approval Notes, Rejection Reason, Approve, Reject
- **If status=approved:** Fulfillment Notes, Mark as Fulfilled

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Request Header** | Ticket, title, status | Identification |
| **Service Item** | Name, category | Service Catalog |
| **Requester** | Name, contact | Traceability |
| **Lifecycle History** | Action, from/to status, actor, reason, timestamp | Audit trail |
| **Approval Section** | Notes, Approve, Reject with reason | Request Fulfillment |
| **Fulfillment Section** | Notes, Mark as Fulfilled | Request Fulfillment |
| **Assign** | Assign to fulfiller | Ownership |
| **Link to CI** | If fulfillment creates/affects CI | CMDB integration |

**Gaps:** Add Assign action; Link to CI when fulfilling (e.g., new laptop → create CI).

---

## 4. Problems

### 4.1 Create Problem Modal (Dialog)

**Location:** `/problems` – "Create Problem" button

**Current UI Elements:**
- Placeholder text: "Problem creation form will be implemented here with full ITIL fields."

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Brief description | Problem Management |
| **Description** | Detailed description | Problem control |
| **Priority** | Critical, High, Medium, Low | Prioritization |
| **Impact** | Critical, High, Medium, Low | Impact assessment |
| **Urgency** | Critical, High, Medium, Low | Urgency |
| **Linked Incidents** | Select incident(s) that triggered problem | Problem identification |
| **Category** | Infrastructure, Application, Process, etc. | Categorization |
| **Known Error** | Checkbox to mark as known error | Error control |
| **Workaround** | If known error, document workaround | Error control |
| **Root Cause** | Optional at creation | Problem control |

**Gaps:** **Critical** – Form is placeholder; implement full fields above.

---

## 5. Changes

### 5.1 Create Change Page (Full Page Form, not Modal)

**Location:** `/changes/new` – Dedicated page

**Current UI Elements:**
- Title, Description, Reason (required)
- Type: Standard, Normal, Emergency
- Risk Level, Impact Level
- Planned Start, Planned End
- Test Plan, Rollback Plan
- Linked Incident IDs (comma-separated)
- Cancel, Create Change

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Brief description | Change Enablement |
| **Description** | Implementation steps | Change assessment |
| **Reason** | Business/technical justification | Authorization |
| **Type** | Standard, Normal, Emergency | Change classification |
| **Risk Level** | Low, Medium, High, Critical | Risk assessment |
| **Impact Level** | Low, Medium, High, Critical | Impact assessment |
| **Planned Window** | Start, End | Change schedule |
| **Test Plan** | Validation steps | Quality |
| **Rollback Plan** | Backout procedure | Risk mitigation |
| **Affected CIs** | Select CIs (not just incidents) | Impact analysis |
| **CAB Required** | Auto-derived from type; show approvers | Authorization |
| **Linked Incidents** | If change is incident-driven | Traceability |

**Gaps:** Add Affected CIs selector (multi-select from CMDB); show CAB/approver requirements based on type; consider optional "Create Change" modal from `/changes` for quick entry.

---

## 6. Tasks

### 6.1 Create Task Modal (Dialog)

**Location:** `/tasks` – "Create Task" button

**Current UI Elements:**
- Title (required)
- Description
- Priority (critical, high, medium, low)
- Due Date (datetime-local)
- Incident ID (optional)
- Workflow ID (optional)
- Team ID (optional)
- Source Entity Type, Source Entity ID
- Estimated Minutes, Tags
- Cancel, Create Task

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Task title | General |
| **Description** | Task details | Execution context |
| **Priority** | Critical, High, Medium, Low | Prioritization |
| **Due Date** | When task is due | SLA for tasks |
| **Assignee** | Assign to user (or team) | Ownership |
| **Link to Incident** | Optional | Incident support |
| **Link to Workflow** | Optional | Workflow support |
| **Link to Violation** | Optional | Compliance remediation |
| **Source Entity** | Type + ID for traceability | Traceability |
| **Estimated Minutes** | For time tracking | Measurement |
| **Tags** | For filtering | Categorization |

**Gaps:** Add Assignee selector (user picker instead of/in addition to Team ID); Add Violation ID link; replace raw IDs with searchable pickers where possible.

---

### 6.2 Task Filters Modal (Dialog)

**Location:** `/tasks` – Filter button

**Current UI Elements:**
- Status, Type, Priority, Assignee, Source Entity Type, Incident ID, Workflow ID, Date range, Tags
- Apply Filters, Clear

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Status** | Pending, In Progress, Completed, etc. | Lifecycle |
| **Priority** | Critical, High, Medium, Low | Prioritization |
| **Assignee** | My tasks, specific user | Ownership |
| **Source** | Incident, Workflow, Violation | Traceability |
| **Date Range** | From, To | Time-based filtering |
| **SLA Status** | On track, At risk, Breached | SLM |

**Gaps:** Add SLA Status filter; ensure Assignee uses user picker.

---

### 6.3 Edit Task Modal (Dialog)

**Location:** `/tasks` (sheet) and `/tasks/[id]` – Edit button

**Current UI Elements:**
- Title, Description, Priority, Due Date, Status
- Cancel, Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Editable | General |
| **Description** | Editable | Context |
| **Priority** | Editable | Prioritization |
| **Due Date** | Editable | SLA |
| **Status** | Editable (with transitions) | Lifecycle |
| **Assignee** | Reassign | Ownership |
| **Time Spent** | Actual minutes (if supported) | Measurement |

**Gaps:** Add Assignee; Time Spent (actual minutes) if backend supports.

---

### 6.4 Assign Task Modal (Dialog)

**Location:** `/tasks` (sheet), `/tasks/[id]` – Assign button

**Current UI Elements:**
- User/Assignee selector
- Cancel, Assign

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Assignee** | User picker (searchable) | Ownership |
| **Team** | Optional: assign to team | Team-based assignment |
| **Due Date** | Optional: adjust on assign | SLA |

**Gaps:** Add Team option; ensure user picker is searchable.

---

### 6.5 Delete Task Modal (Dialog)

**Location:** `/tasks` (sheet), `/tasks/[id]` – Delete button

**Current UI Elements:**
- Confirmation message
- Cancel, Delete

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Confirmation** | "Delete task X? This cannot be undone." | Prevent accidental deletion |
| **Reason** | Optional: why deleting (for audit) | Audit trail |

**Gaps:** Add optional Reason field for audit.

---

### 6.6 Task Detail Sheet (Slide-over Panel)

**Location:** `/tasks` – Click task row

**Current UI Elements:**
- Priority, Status, SLA badges
- Description
- Assignee, Due Date, Time Remaining, Estimated
- Linked Records (Incident, Workflow)
- Start, Complete, Reopen, Cancel actions
- Edit, Assign, Delete buttons

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Header** | Title, priority, status, SLA | Identification |
| **Description** | Full description | Context |
| **Assignee** | Assigned user | Ownership |
| **Due Date / Time Remaining** | SLA visibility | SLM |
| **Linked Records** | Incident, Workflow, Violation | Traceability |
| **Lifecycle Actions** | Start, Complete, Reopen, Cancel | Lifecycle |
| **Time Tracking** | Estimated vs actual | Measurement |

**Gaps:** Add Violation link if applicable; Time Spent display when completed.

---

## 7. Workflows

### 7.1 Workflow Creation Wizard (2-Step Dialog)

**Location:** `/workflows` – "Create Workflow" button

**Current UI Elements:**
- **Step 1:** Mode (Manual / From Template), Workflow Name, Workflow Type, Incident ID (optional)
- **Step 2 (Manual):** Steps (name, type, description, assignee, next steps), Context JSON
- **Step 2 (Template):** Template selector, Auto-create Tasks
- Step indicator (1 of 2)
- Back, Next, Create Workflow, Cancel

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Mode** | Manual vs Template | Flexibility |
| **Workflow Name** | Descriptive name | Identification |
| **Workflow Type** | Approval, Incident Escalation, Change Request, Onboarding, Offboarding, Review | Value stream alignment |
| **Link to Incident** | Optional | Incident support |
| **Steps** | Name, type (manual/approval/auto), description, assignee, next steps | Process definition |
| **Template** | Predefined workflow | Standardization |
| **Auto-create Tasks** | Per step | Task automation |
| **Context** | JSON for workflow variables | Flexibility |

**Gaps:** Add "Link to Change" for change approval workflows; Add "Link to Request" for request fulfillment workflows; Step validation (e.g., at least one step).

---

### 7.2 Workflow Filters Modal (Dialog)

**Location:** `/workflows` – Filter button

**Current UI Elements:**
- Status, Type, Entity ID
- Apply, Clear

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Status** | Pending, In Progress, Completed, Failed, Cancelled | Lifecycle |
| **Type** | Approval, Incident Escalation, Change Request, etc. | Categorization |
| **Entity ID** | Filter by linked incident/change | Traceability |
| **Created Date Range** | From, To | Time-based |

**Gaps:** Add Created Date Range; Incident ID / Change ID as dedicated filters.

---

### 7.3 Advance Workflow Modal (Dialog)

**Location:** `/workflows` (sheet) – Advance action

**Current UI Elements:**
- Action (Approve, Reject, Skip, Retry)
- Next Step (optional)
- Comment
- Action Data (JSON)
- Cancel, Submit Action

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Action** | Approve, Reject, Skip, Retry | Step completion |
| **Next Step** | Override automatic next | Flexibility |
| **Comment** | Decision context | Audit trail |
| **Action Data** | Structured output for next step | Process flow |

**Gaps:** For Approval steps, make Approve/Reject primary; add "Approval Reason" as required when Reject.

---

### 7.4 Rollback Workflow Modal (Dialog)

**Location:** `/workflows` (sheet) – Rollback action

**Current UI Elements:**
- Target Step selector
- Reason (required)
- Cancel, Rollback

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Target Step** | Which step to roll back to | Process control |
| **Reason** | Why rollback | Audit trail |
| **Impact Warning** | "Tasks created after this step may be affected" | Risk communication |

**Gaps:** Add impact warning for user awareness.

---

### 7.5 Cancel Workflow Modal (Dialog)

**Location:** `/workflows` (sheet), `/workflows/[id]` – Cancel action

**Current UI Elements:**
- Reason (required)
- Keep Active, Cancel Workflow

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Reason** | Required for cancellation | Audit trail |
| **Confirmation** | Destructive action | Prevent accidents |

**Gaps:** None; well aligned.

---

### 7.6 Delete Workflow Modal (Dialog)

**Location:** `/workflows` (sheet) – Delete action

**Current UI Elements:**
- Confirmation message with workflow name
- Cancel, Delete

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Confirmation** | "Delete workflow X? Cannot be undone." | Prevent accidents |
| **Linked Entities** | Warning if linked to incident/change | Impact awareness |

**Gaps:** Add warning if workflow is linked to active incident/change.

---

## 8. Knowledge

### 8.1 New Knowledge Article Page (Full Page Form)

**Location:** `/knowledge/new` – "New Article" button

**Current UI Elements:**
- Title, Category (general, howto, troubleshooting, reference)
- Tags (comma-separated)
- Content (textarea)
- Cancel, Create Draft

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Title** | Article title | Knowledge Management |
| **Category** | General, How-To, Troubleshooting, Reference | Categorization |
| **Tags** | For search | Discoverability |
| **Content** | Full content (rich text preferred) | Knowledge capture |
| **Status** | Draft / Published (default Draft) | Lifecycle |
| **Link to Incident** | Optional: created from incident resolution | Knowledge capture |
| **Link to Problem** | Optional: known error article | Problem Management |
| **Review Date** | Optional: when to review | Currency |

**Gaps:** Add Link to Incident/Problem when creating from resolution; Review Date; Rich text editor for content.

---

### 8.2 Edit Knowledge Article Modal (if exists)

**Location:** `/knowledge/[id]` – Edit button

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Version** | Show current version; new version on save | Version control |
| **Change Summary** | What changed (optional) | Audit |
| **Status** | Draft, Published, Archived | Lifecycle |

---

## 9. CMDB (Configuration Items)

### 9.1 Add/Edit Configuration Item Modal (Dialog)

**Location:** `/configuration-items` – "Add CI", Edit (pencil) on row

**Current UI Elements:**
- Name, Type, Status, Criticality
- Environment, Owner Team, Description
- Cancel, Create / Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | CI name | Service Configuration Management |
| **Type** | Application, Server, Database, Network, etc. | CI classification |
| **Status** | Active, Inactive, Retired | Lifecycle |
| **Criticality** | Low, Medium, High, Critical | Impact assessment |
| **Environment** | Production, Staging, Development | Environment |
| **Owner/Team** | Responsible team | Ownership |
| **Description** | CI description | Context |
| **Parent CI** | Optional: parent in hierarchy | Relationships |
| **Relationships** | Depends on, Part of (future) | CMDB relationships |

**Gaps:** Add Parent CI selector; Relationships section for dependencies.

---

## 10. Compliance

### 10.1 Create Policy Modal (Dialog)

**Location:** `/compliance` – "Create Policy" button

**Current UI Elements:**
- Policy Name, Description
- Category (Security, Compliance, Operations, HR, Finance)
- Cancel, Create Policy

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | Policy name | Risk Management |
| **Description** | Policy content/scope | Governance |
| **Category** | Security, Compliance, Operations, HR, Finance | Categorization |
| **Status** | Draft (default) | Lifecycle |
| **Version** | Auto or manual | Version control |
| **Effective Date** | When policy takes effect | Governance |

**Gaps:** Add Status (default Draft); Version; Effective Date.

---

### 10.2 Edit Policy Modal (Dialog)

**Location:** `/compliance/[id]` – Edit button

**Current UI Elements:**
- Same as Create (Name, Description, Category)
- Cancel, Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Version** | Increment on save; show history | Version control |
| **Status** | Draft, Active, Deprecated, Archived | Lifecycle |
| **Change Reason** | Optional: why updated | Audit |

**Gaps:** Add Version display; Status; Change Reason for audit.

---

## 11. Violations

### 11.1 Assign Violation Modal (Dialog)

**Location:** `/violations/[id]` – Assign button

**Current UI Elements:**
- Assignee selector (user picker)
- Cancel, Assign

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Assignee** | User picker | Ownership |
| **Team** | Optional: assign to team | Team-based |
| **Due Date** | Remediation target | SLA for remediation |
| **Priority** | Override severity for assignment | Prioritization |

**Gaps:** Add Due Date; Team option; ensure user picker is searchable.

---

## 12. Reports

### 12.1 Run ITIL Report Modal (Dialog)

**Location:** `/reports` – "Run Report" / "Generate" button

**Current UI Elements:**
- Report Type (Incident Summary, SLA Compliance, User Activity, Audit Log, ITIL KPI, Incident Lifecycle, Workflow KPI)
- Template description and KPI focus
- Format (JSON, CSV)
- Time Window (Last 24h, 7d, 30d, Quarter to date)
- Include Evidence Fields (Yes/No)
- Cancel, Generate Report

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Report Type** | ITIL-aligned report types | Continual Improvement |
| **Format** | CSV, JSON (PDF optional) | Consumption |
| **Time Window** | Configurable range | Measurement |
| **Include Evidence** | For audit/compliance | Governance |
| **Filters** | Optional: status, priority, team | Targeted reporting |
| **Schedule** | Optional: run on schedule | Automation |

**Gaps:** Add optional Filters (status, priority, team); Schedule option for recurring reports.

---

## 13. Activities

### 13.1 Activity Detail Modal (Dialog)

**Location:** `/activities` – Click activity row

**Current UI Elements:**
- Entity type, action badges
- Title, description
- Entity ID, timestamp
- Entity Timeline (related activities)
- Metadata (JSON)
- Open Incident/Workflow/Task (contextual)
- Close

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Entity Type** | Incident, Workflow, Task, etc. | Traceability |
| **Action** | Created, Updated, Transitioned | Audit |
| **Title/Description** | Context | Understanding |
| **Actor** | Who performed (if available) | Accountability |
| **Timestamp** | When | Audit |
| **Entity Timeline** | Related activities | Correlation |
| **Metadata** | Additional context | Debugging |
| **Navigate to Entity** | Open source record | Traceability |

**Gaps:** Add Actor display if available from API; System Record ID for correlation.

---

## 14. Settings

### 14.1 Add/Edit Webhook Modal (Dialog)

**Location:** `/settings` – Add Webhook, Edit (pencil)

**Current UI Elements:**
- Name, URL
- Secret (optional)
- Events (checkboxes): incident.created, incident.updated, incident.resolved, problem.created, problem.resolved, change.created, change.approved, change.implemented, sla.breach
- Active (checkbox)
- Cancel, Create/Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | Webhook identifier | Integration |
| **URL** | Endpoint URL | Integration |
| **Secret** | For signature verification | Security |
| **Events** | ITIL-relevant events | Engagement |
| **Active** | Enable/disable | Control |
| **Test** | Send test payload | Validation |
| **Last Triggered** | Display last success/failure | Monitoring |

**Gaps:** Add Test button; Last Triggered / Last Error in form or list.

---

### 14.2 Notification Preferences (Inline, not Modal)

**Location:** `/settings` – Toggle switches

**Current UI Elements:**
- Email: Incident Assigned, Incident Resolved, SLA Breached, Change Approved, Daily Digest
- In-app: All notifications

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Email Preferences** | Per event type | Engagement |
| **In-App Preferences** | Global or per type | Engagement |
| **Quiet Hours** | Optional: suppress non-critical | UX |
| **Digest Frequency** | Daily, Weekly, None | Engagement |

**Gaps:** Unify with backend (Phase 3); Add Quiet Hours; Digest frequency.

---

## 15. Admin

### 15.1 Invite New User Modal (Dialog)

**Location:** `/admin` – Users tab – "Invite User" button

**Current UI Elements:**
- First Name, Last Name
- Email, Password
- Assign Roles (multi-select chips)
- Cancel, Send Invite

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **First Name, Last Name** | User identity | Organizations and People |
| **Email** | Login identifier | Authentication |
| **Password** | Initial password (or invite link) | Security |
| **Roles** | RBAC assignment | Governance |
| **Team** | Optional: default team | Team structure |
| **Send Invite** | Email invite vs direct create | Onboarding |

**Gaps:** Add Team assignment; Consider invite-by-email flow (no password, user sets on first login).

---

### 15.2 Edit User Modal (Dialog)

**Location:** `/admin` – Users tab – Edit (pencil)

**Current UI Elements:**
- First Name, Last Name
- Active (checkbox)
- Cancel, Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | Editable | Identity |
| **Active** | Enable/disable account | Access control |
| **Roles** | Edit role assignment | RBAC |
| **Teams** | Edit team membership | Structure |

**Gaps:** Add Roles and Teams editing in same dialog or separate section.

---

### 15.3 Create Role Modal (Dialog)

**Location:** `/admin` – Roles tab – "Create Role" button

**Current UI Elements:**
- Role Name, Description
- Permissions (multi-select: resource.action)
- Cancel, Create Role

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | Role name | RBAC |
| **Description** | Role purpose | Governance |
| **Permissions** | Resource × Action matrix | Granular access |
| **Inherit From** | Optional: base role | Simplification |

**Gaps:** Add Inherit From for role hierarchy; Group permissions by resource for readability.

---

### 15.4 Edit Role Modal (Dialog)

**Location:** `/admin` – Roles tab – Edit (pencil)

**Current UI Elements:**
- Same as Create
- Cancel, Save

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **System Role** | Read-only if system role | Protect system roles |
| **Permissions** | Editable | RBAC |

**Gaps:** Disable edit for system roles; show warning if reducing permissions (users may lose access).

---

### 15.5 Delete Role Modal (Dialog)

**Location:** `/admin` – Roles tab – Delete

**Current UI Elements:**
- Confirmation message
- Cancel, Delete

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Confirmation** | "Delete role X? Users will lose access." | Prevent accidents |
| **Affected Users** | Count or list of users with this role | Impact awareness |

**Gaps:** Add Affected Users count or list.

---

### 15.6 Create Team Modal (Dialog)

**Location:** `/admin` – Teams tab – "Create Team" button

**Current UI Elements:**
- Name, Description
- Cancel, Create Team

**Required UI Elements for ITIL Alignment**

| Element | Description | ITIL Practice |
|---------|-------------|---------------|
| **Name** | Team name | Organizations and People |
| **Description** | Team purpose | Structure |
| **Lead** | Optional: team lead | Ownership |
| **Members** | Optional: add members at creation | Structure |

**Gaps:** Add Lead selector; Members multi-select at creation.

---

### 15.7 Admin Tabs (Inline Navigation)

**Location:** `/admin` – Tab bar

**Current Tabs:**
- Users
- Roles & Permissions
- Teams
- Organization

**Required UI Elements for ITIL Alignment**

| Tab | Description | ITIL Practice |
|-----|-------------|---------------|
| **Users** | User management | Organizations and People |
| **Roles & Permissions** | RBAC | Governance |
| **Teams** | Team structure | Organizations and People |
| **Organization** | Org settings | Governance |
| **CAB** | Optional: CAB members for change approval | Change Enablement |

**Gaps:** Add CAB tab for Change Advisory Board configuration.

---

## Summary: Priority Gaps by Component Type

| Component | Section | Priority Gap |
|-----------|---------|--------------|
| Create Problem Modal | Problems | **Critical** – Placeholder; implement full form |
| Create Incident Modal | Incidents | Add Major Incident, Link to Problem |
| Transition Modal | Incidents | Add Link to Problem, Link to Knowledge Article |
| Request Sheet | Catalog/Requests | Add Assign, Link to CI on fulfill |
| Create Change Page | Changes | Add Affected CIs, CAB display |
| Create Task Modal | Tasks | Add Assignee picker, Violation link |
| Webhook Modal | Settings | Add Test button |
| Admin Dialogs | Admin | Add CAB tab, Team members at creation |
| Command Palette | Global | Ensure all create actions registered |

---

## References

- ITIL 4 Practice Guides
- NexusOps ITIL Service Desk Consolidation Plan
- NexusOps ITIL Sidebar Sections Alignment (`docs/itil-sidebar-sections-alignment.md`)
