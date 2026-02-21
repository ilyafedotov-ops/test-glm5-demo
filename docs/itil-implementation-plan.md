# ITIL Gaps Implementation Plan

This plan consolidates gaps identified in:
- `docs/itil-sidebar-sections-alignment.md`
- `docs/itil-modals-wizards-menus-alignment.md`

and defines implementation order, dependencies, and acceptance criteria.

---

## Phase 1: Critical UI Gaps (Immediate)

### 1.1 Create Problem Modal — **CRITICAL**

**Status:** Placeholder only; blocks Problem Management practice.

**Scope:**
- Replace placeholder with full ITIL form
- Fields: Title, Description, Priority, Impact, Urgency, Linked Incidents, Assignee, Team, Known Error, Workaround, Root Cause

**Backend:** API supports all fields (`CreateProblemDto`). Add `GET /problems/options` for incidents, users, teams.

**Tasks:**
1. [x] Add `GET /problems/options` endpoint (incidents, users, teams)
2. [x] Implement Create Problem modal with full form
3. [x] Wire create mutation to `POST /problems`
4. [x] Add incident multi-select (searchable)
5. [x] Add assignee/team selectors

**Acceptance:** User can create problem with all ITIL fields; incidents can be linked. **DONE**

---

### 1.2 Help & Support Link (User Dropdown)

**Status:** Empty action; poor UX.

**Scope:** Add link to `/knowledge` or external support URL.

**Tasks:**
1. [x] Update `DropdownMenuItem` for Help & Support to navigate to `/knowledge`

**Acceptance:** Clicking Help & Support opens knowledge base. **DONE**

---

## Phase 2: High-Priority Modal Enhancements

### 2.1 Create Incident Modal — Major Incident & Link to Problem

**Scope:**
- Add "Major Incident" checkbox
- Add optional "Link to Problem" (when resolving or at creation)

**Backend:** Check if `CreateIncidentDto` supports `isMajorIncident`, `problemId`. Add if missing.

**Tasks:**
1. [ ] Add `isMajorIncident` to Create Incident form (if API supports)
2. [ ] Add `problemId` / Link to Problem selector (optional)

**Acceptance:** Major incidents can be flagged; problems can be linked.

---

### 2.2 Incident Transition Modal — Link to Problem & Knowledge

**Scope:**
- When transitioning to Resolved/Closed: add "Link to Problem" and "Link to Knowledge Article"

**Backend:** Check if transition DTO supports `problemId`, `knowledgeArticleId`.

**Tasks:**
1. [ ] Add problem selector when resolving
2. [ ] Add knowledge article selector when resolving
3. [ ] Wire to transition API

**Acceptance:** Resolution can reference problem and knowledge article.

---

### 2.3 Create Task Modal — Assignee Picker & Violation Link

**Scope:**
- Replace raw IDs with searchable Assignee picker (users)
- Add Violation ID link option

**Backend:** Need assignable users. Options: add `GET /tasks/options` or reuse existing endpoint with appropriate permissions.

**Tasks:**
1. [x] Add `GET /tasks/options` endpoint (users, teams)
2. [x] Add Assignee Select component
3. [x] Add Violation ID field
4. [x] Replace Team ID input with Team selector

**Acceptance:** Task can be assigned via user picker; violation can be linked. **DONE**

---

### 2.4 Request Fulfillment Sheet — Assign & Link to CI

**Scope:** `/catalog/requests` detail sheet
- Add Assign action (assign to fulfiller)
- Add Link to CI when fulfilling (if applicable)

**Backend:** Check if service request assign and fulfill support assigneeId, configurationItemId.

**Tasks:**
1. [ ] Add Assign button and assignee selector
2. [ ] Add CI selector in Fulfill section
3. [ ] Wire to API

**Acceptance:** Requests can be assigned; fulfillment can link to CI.

---

### 2.5 Create Change Page — Affected CIs

**Scope:** `/changes/new`
- Add Affected Configuration Items multi-select
- Show CAB/approver requirements based on change type

**Backend:** Check if CreateChangeDto supports `configurationItemIds`.

**Tasks:**
1. [ ] Add Affected CIs multi-select from CMDB
2. [ ] Add CAB info display (if backend provides)

**Acceptance:** Changes can reference affected CIs.

---

## Phase 3: Medium-Priority Enhancements

### 3.1 Webhook Modal — Test Button

**Scope:** Settings → Add/Edit Webhook
- Add "Test Webhook" button that sends a sample payload

**Backend:** Add `POST /settings/webhooks/:id/test` or similar.

**Tasks:**
1. [ ] Add test endpoint (if not exists)
2. [ ] Add Test button to webhook form
3. [ ] Show test result (success/failure)

**Acceptance:** User can test webhook before saving.

---

### 3.2 Admin — Create Team with Lead & Members

**Scope:** Create Team dialog
- Add Team Lead selector
- Add Members multi-select at creation

**Backend:** Check if CreateTeamDto supports `leadId`, `memberIds`.

**Tasks:**
1. [ ] Add Lead selector
2. [ ] Add Members multi-select
3. [ ] Wire to API

**Acceptance:** Team can be created with lead and members.

---

### 3.3 Admin — CAB Tab

**Scope:** Add CAB configuration tab for Change Advisory Board.

**Backend:** May require new CAB model and APIs.

**Tasks:**
1. [ ] Design CAB data model (if not exists)
2. [ ] Add CAB tab to Admin
3. [ ] Add CAB members configuration UI
4. [ ] Wire change approval to CAB

**Acceptance:** CAB members can be configured; changes use CAB for approval.

---

### 3.4 Command Palette — Register Create Actions

**Scope:** Ensure all create actions (Incident, Problem, Change, Task) are in command palette.

**Tasks:**
1. [ ] Audit command palette registration
2. [ ] Add missing create actions
3. [ ] Add navigation shortcuts

**Acceptance:** Cmd+K shows create incident, problem, change, task.

---

## Phase 4: Lower-Priority / Future

### 4.1 Policy Create/Edit — Version, Status, Effective Date

### 4.2 Delete Role — Affected Users Count

### 4.3 Workflow Delete — Linked Entities Warning

### 4.4 CMDB — CI Relationships, Parent CI

### 4.5 SLA Dashboard — Target Configuration UI

### 4.6 Reports — Filters, Schedule

---

## Execution Order

| Order | Item | Phase | Est. Effort |
|-------|------|-------|-------------|
| 1 | Create Problem Modal (full form) | 1 | 2–3h |
| 2 | Help & Support link | 1 | 5m |
| 3 | Problems options endpoint | 1 | 30m |
| 4 | Major Incident checkbox (if API supports) | 2 | 30m |
| 5 | Incident transition — Link to Problem/Knowledge | 2 | 1h |
| 6 | Create Task — Assignee picker | 2 | 1–2h |
| 7 | Request fulfillment — Assign, Link to CI | 2 | 1h |
| 8 | Create Change — Affected CIs | 2 | 1h |
| 9 | Webhook Test button | 3 | 1h |
| 10 | Admin Team — Lead, Members | 3 | 1h |
| 11 | CAB tab | 3 | 2–3h |
| 12 | Command palette audit | 3 | 30m |

---

## Build Verification

After each batch:
```bash
pnpm build
# or
pnpm --filter @nexusops/api build
pnpm --filter @nexusops/web build
```

---

## Tracking

- **Status:** `todo` | `in_progress` | `done`
- Update this document and consolidation plan as items complete.
