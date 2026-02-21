"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@nexusops/ui";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Menu,
  MessageCircle,
  Send,
  Settings,
  Shield,
  User,
  X,
  AlertTriangle,
  Wrench,
  GitBranch,
  CheckSquare,
  BarChart3,
  FileText,
  Home,
  Plus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";
import { APP_NAV_ITEMS } from "@/config/navigation";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import type { CommandAction } from "@/components/command-palette";

async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/notifications?unread=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return 0;
  }

  const payload = await res.json();
  return payload.unreadCount || 0;
}

async function fetchNotifications(token: string): Promise<{
  data: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
}> {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { data: [], unreadCount: 0 };
  const json = await res.json();
  return { data: (json.data || []).slice(0, 5), unreadCount: json.unreadCount ?? 0 };
}

async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: "Hi! I'm your NexusOps support assistant. How can I help you today?",
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["shell-notification-unread", token],
    queryFn: () => fetchUnreadCount(token!),
    enabled: isAuthenticated && !!token,
    refetchInterval: 30000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["shell-notifications", token],
    queryFn: () => fetchNotifications(token!),
    enabled: isAuthenticated && !!token,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shell-notification-unread"] });
      queryClient.invalidateQueries({ queryKey: ["shell-notifications"] });
    },
  });

  const {
    isOpen: commandPaletteOpen,
    close: closeCommandPalette,
    recentCommands,
    handleRecentChange,
  } = useCommandPalette();

  const commandPaletteCommands: CommandAction[] = [
    {
      id: "create-incident",
      label: "Create Incident",
      description: "Log a new incident",
      icon: AlertTriangle,
      category: "create",
      keywords: ["incident", "new"],
      action: () => router.push("/incidents?create=1"),
    },
    {
      id: "create-problem",
      label: "Create Problem",
      description: "Create a new problem record",
      icon: Wrench,
      category: "create",
      keywords: ["problem", "root cause"],
      action: () => router.push("/problems?create=1"),
    },
    {
      id: "create-change",
      label: "Create Change",
      description: "Submit a change request",
      icon: GitBranch,
      category: "create",
      keywords: ["change", "request"],
      action: () => router.push("/changes/new"),
    },
    {
      id: "create-task",
      label: "Create Task",
      description: "Create a new task",
      icon: CheckSquare,
      category: "create",
      keywords: ["task", "todo"],
      action: () => router.push("/tasks?create=1"),
    },
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      description: "Open dashboard",
      icon: Home,
      category: "navigation",
      action: () => router.push("/dashboard"),
    },
    {
      id: "nav-incidents",
      label: "Go to Incidents",
      description: "Open incidents",
      icon: AlertTriangle,
      category: "navigation",
      action: () => router.push("/incidents"),
    },
    {
      id: "nav-problems",
      label: "Go to Problems",
      description: "Open problems",
      icon: Wrench,
      category: "navigation",
      action: () => router.push("/problems"),
    },
    {
      id: "nav-changes",
      label: "Go to Changes",
      description: "Open changes",
      icon: GitBranch,
      category: "navigation",
      action: () => router.push("/changes"),
    },
    {
      id: "nav-tasks",
      label: "Go to Tasks",
      description: "Open tasks",
      icon: CheckSquare,
      category: "navigation",
      action: () => router.push("/tasks"),
    },
    {
      id: "nav-reports",
      label: "Go to Reports",
      description: "Open reports",
      icon: BarChart3,
      category: "navigation",
      action: () => router.push("/reports"),
    },
    {
      id: "nav-knowledge",
      label: "Search Knowledge",
      description: "Open knowledge base",
      icon: FileText,
      category: "navigation",
      keywords: ["knowledge", "search"],
      action: () => router.push("/knowledge"),
    },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!isAuthenticated) {
    return null;
  }

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "JD";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    setChatMessages((prev) => [...prev, { role: "user", content: chatMessage }]);
    setChatMessage("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thanks for your message! A support team member will respond shortly. For immediate assistance, contact support@nexusops.com",
        },
      ]);
    }, 1000);
  };

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      APP_NAV_ITEMS.find((item) => item.href === href)?.label ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return { href, label };
  });

  const mainNavItems = APP_NAV_ITEMS.filter((item) => item.section === "main");
  const helpNavItems = APP_NAV_ITEMS.filter((item) => item.section === "help");
  const isAdminUser =
    !!user &&
    (user.roles?.some((role) => role.name === "admin") ||
      user.permissions?.some((permission) => permission.name === "admin:all"));
  const adminNavItems = isAdminUser ? APP_NAV_ITEMS.filter((item) => item.section === "admin") : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 bg-mesh-gradient opacity-50 dark:opacity-30" />

      <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mr-4 lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3 mr-6 group">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
              <Shield className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <span className="font-bold text-xl hidden sm:block gradient-text">NexusOps</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link
                  href={crumb.href}
                  className={cn(
                    "transition-colors",
                    i === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "hover:text-foreground"
                  )}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          <DropdownMenu
            trigger={
              <button className="relative p-2.5 rounded-xl hover:bg-accent transition-all hover:scale-105 active:scale-95">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-[10px] text-white font-semibold flex items-center justify-center ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            }
            align="end"
          >
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsData?.data && notificationsData.data.length > 0 ? (
              <>
                <div className="max-h-64 overflow-y-auto">
                  {notificationsData.data.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => {
                        if (n.actionUrl) router.push(n.actionUrl);
                        else router.push("/notifications");
                      }}
                    >
                      <div className="flex flex-col items-start gap-0.5 py-1">
                        <span className="font-medium text-sm truncate w-full">{n.title}</span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {n.message}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                {unreadCount > 0 && (
                  <DropdownMenuItem
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                  >
                    Mark all as read
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "No new notifications"}
              </div>
            )}
            <DropdownMenuItem onClick={() => router.push("/notifications")}>
              View all
            </DropdownMenuItem>
          </DropdownMenu>

          <div className="ml-2">
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-accent transition-all group">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user?.roles?.[0]?.name || "User"}
                    </p>
                  </div>
                </button>
              }
              align="end"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              {user?.roles?.[0]?.name && (
                <div className="px-4 py-2">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {user.roles[0].name}
                  </Badge>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Bell className="h-4 w-4 mr-2" />
                Notification Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help")}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 transition-all lg:translate-x-0",
            "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-white/10",
            !mobileMenuOpen && "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full p-3">
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const showUnread = item.href === "/notifications" && unreadCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        isActive && "drop-shadow-sm"
                      )}
                    />
                    <span>{item.label}</span>
                    {showUnread && (
                      <Badge className="ml-auto bg-white/20 text-white border-0 text-xs px-2">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}

              {adminNavItems.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    Administration
                  </div>
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isActive && "drop-shadow-sm"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {helpNavItems.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                    Help & Support
                  </div>
                  {helpNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isActive && "drop-shadow-sm"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            <div className="mt-4">
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 dark:from-violet-500/20 dark:via-purple-500/20 dark:to-pink-500/20 p-4 border border-violet-200/50 dark:border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-violet-500" />
                  <h4 className="font-semibold text-sm">Need Help?</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Contact our support team for assistance.
                </p>
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full text-xs bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open Support Chat
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Support Chat</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      <CommandPalette
        commands={commandPaletteCommands}
        groups={[
          { id: "create", label: "Create", icon: Plus, priority: 0 },
          { id: "navigation", label: "Navigation", icon: Home, priority: 1 },
        ]}
        isOpen={commandPaletteOpen}
        onClose={closeCommandPalette}
        recentCommands={recentCommands}
        onRecentChange={handleRecentChange}
        placeholder="Type a command or search... (Create incident, problem, change, task...)"
      />
    </div>
  );
}
