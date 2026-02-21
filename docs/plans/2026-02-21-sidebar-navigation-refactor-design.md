# Sidebar Navigation Refactor Design

## Overview
Refactor the sidebar navigation from a flat 16-item list to a grouped, collapsible accordion structure for better organization and user experience.

## Current State
- 16 main navigation items in a flat list
- 3 help/support items
- 2 admin items (admin-only)
- No expandable/collapsible groups
- Visual clutter and poor navigation experience

## Proposed Structure

### Navigation Groups

1. **Service Operations** (`service-operations`)
   - Dashboard
   - Incidents
   - Problems
   - Changes

2. **Task Management** (`task-management`)
   - Tasks
   - Workflows

3. **Knowledge & CMDB** (`knowledge`)
   - Knowledge Base
   - CMDB
   - Service Requests

4. **Analytics** (`analytics`)
   - Reports
   - Activities
   - SLA Dashboard

5. **Compliance** (`compliance`)
   - Compliance
   - Violations
   - Audit Logs

6. **Administration** (`admin`) - Admin only
   - Admin Panel
   - Settings
   - Notifications

7. **Help & Support** (`help`)
   - Help
   - Support
   - About

### Data Structure

```typescript
interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  requiredPermission?: string; // For admin-only groups
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}
```

## Accordion Behavior

- **Single Expand**: Only one group can be expanded at a time
- **Auto-Expand**: Active route's parent group auto-expands on page load
- **State Persistence**: Expanded group persisted to localStorage (`nexusops-nav-expanded`)
- **Animations**: Smooth CSS transitions for expand/collapse
- **Visual Indicators**: Chevron icon rotates to indicate expanded state

## Implementation

### Files to Modify

1. `apps/web/src/config/navigation.ts` - Refactor to new group structure
2. `apps/web/src/components/app-shell.tsx` - Implement collapsible accordion sidebar

### New Component (Optional)

Consider extracting sidebar into a separate component:
- `apps/web/src/components/sidebar.tsx` - Collapsible accordion sidebar

## Success Criteria

- [ ] All navigation items properly grouped
- [ ] Accordion expand/collapse works correctly
- [ ] Active route auto-expands parent group
- [ ] State persists across page reloads
- [ ] Mobile responsive behavior maintained
- [ ] Existing styling preserved (gradient active state, etc.)
- [ ] Admin-only groups hidden for non-admin users
