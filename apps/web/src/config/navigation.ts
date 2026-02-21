import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  BookOpen,
  CheckSquare,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: "main" | "admin";
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "main" },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, section: "main" },
  { href: "/catalog", label: "Requests", icon: ShoppingCart, section: "main" },
  { href: "/problems", label: "Problems", icon: Wrench, section: "main" },
  { href: "/changes", label: "Changes", icon: FileText, section: "main" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, section: "main" },
  { href: "/workflows", label: "Workflows", icon: GitBranch, section: "main" },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen, section: "main" },
  { href: "/configuration-items", label: "CMDB", icon: Database, section: "main" },
  { href: "/compliance", label: "Compliance", icon: Shield, section: "main" },
  { href: "/violations", label: "Violations", icon: AlertCircle, section: "main" },
  { href: "/sla-dashboard", label: "SLA Dashboard", icon: Gauge, section: "main" },
  { href: "/activities", label: "Activities", icon: Activity, section: "main" },
  { href: "/reports", label: "Reports", icon: FileText, section: "main" },
  { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList, section: "main" },
  { href: "/notifications", label: "Notifications", icon: Bell, section: "main" },
  { href: "/admin", label: "Admin", icon: ShieldCheck, section: "admin" },
  { href: "/settings", label: "Settings", icon: Settings, section: "admin" },
];
