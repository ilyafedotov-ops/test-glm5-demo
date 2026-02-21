import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HelpCircle,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  requiredRole?: string;
}

// Legacy export for backward compatibility
export interface AppNavItem extends NavItem {
  section?: "main" | "admin" | "help";
}

// Navigation groups for collapsible sidebar
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "service-operations",
    label: "Service Operations",
    icon: AlertTriangle,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
      { href: "/problems", label: "Problems", icon: Wrench },
      { href: "/changes", label: "Changes", icon: GitBranch },
    ],
  },
  {
    id: "task-management",
    label: "Task Management",
    icon: CheckSquare,
    items: [
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/workflows", label: "Workflows", icon: GitBranch },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge & CMDB",
    icon: BookOpen,
    items: [
      { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/configuration-items", label: "CMDB", icon: Database },
      { href: "/catalog", label: "Service Requests", icon: ShoppingCart },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/activities", label: "Activities", icon: Activity },
      { href: "/sla-dashboard", label: "SLA Dashboard", icon: Gauge },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Shield,
    items: [
      { href: "/compliance", label: "Compliance", icon: Shield },
      { href: "/violations", label: "Violations", icon: AlertCircle },
      { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: ShieldCheck,
    requiredRole: "admin",
    items: [
      { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
      { href: "/users", label: "Users", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    items: [
      { href: "/help", label: "Help", icon: HelpCircle },
      { href: "/support", label: "Support", icon: LifeBuoy },
      { href: "/about", label: "About", icon: Info },
    ],
  },
];

// Helper to find which group contains a path
export function findGroupForPath(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return group.id;
      }
    }
  }
  return null;
}

// Export ChevronDown for accordion icon
export { ChevronDown };

// Legacy flat list for backward compatibility (if needed elsewhere)
export const APP_NAV_ITEMS: AppNavItem[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    section: group.requiredRole === "admin" ? "admin" : group.id === "help" ? "help" : "main",
  }))
);
