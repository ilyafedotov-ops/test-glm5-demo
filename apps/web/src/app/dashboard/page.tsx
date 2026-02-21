"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Network,
  ShieldCheck,
  FileSearch,
  Target,
  Zap,
  BarChart3,
  Plus,
  Gauge,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { StatusMatrix } from "@/components/operations/status-matrix";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";

interface SLATarget {
  priority: string;
  responseTimeMins: number;
  resolutionTimeMins: number;
}

interface DashboardSummary {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  avgResolutionTimeHours: number;
  slaCompliancePercent: number;
  incidentsByStatus: Record<string, number>;
  incidentsByPriority: Record<string, number>;
  trendData: Array<{ date: string; created: number; resolved: number }>;
  slaTargets?: SLATarget[];
  crossDomain?: {
    tasks: number;
    workflows: number;
    violations: number;
    auditLogsLast7Days: number;
    linkageCoveragePercent: number;
  };
  recentActivity?: Array<{
    id: string;
    entityType: string;
    entityId: string;
    systemRecordId: string;
    action: string;
    title: string;
    description?: string;
    createdAt: string;
  }>;
  majorIncidentSummary?: {
    activeCount: number;
    incidents: Array<{
      id: string;
      title: string;
      ticketNumber?: string;
      priority: string;
      status: string;
      commander: string;
      bridgeStatus: "active" | "standby" | "resolved";
      affectedServices: string[];
    }>;
  };
  topRiskServices?: Array<{
    name: string;
    ownerTeam: string;
    openIncidents: number;
    majorIncidents: number;
    atRiskIncidents: number;
    breachedIncidents: number;
    riskScore: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await fetch(`${API_URL}/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
        throw new Error("Session expired");
      }
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded-xl shimmer" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-2xl shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Card variant="glass" className="p-6 text-destructive">
          Failed to load dashboard. Please try again.
        </Card>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Incidents",
      value: data.totalIncidents,
      icon: Activity,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-500/10 to-purple-500/10",
      trend: "+12%",
      trendUp: true,
      href: "/incidents",
    },
    {
      title: "Open Incidents",
      value: data.openIncidents,
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      trend: "-5%",
      trendUp: false,
      href: "/incidents?status=in_progress",
    },
    {
      title: "Critical",
      value: data.criticalIncidents,
      icon: AlertTriangle,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-500/10 to-pink-500/10",
      trend: "+2",
      trendUp: true,
      href: "/incidents?priority=critical",
    },
    {
      title: "SLA Compliance",
      value: `${data.slaCompliancePercent}%`,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      trend: "+3%",
      trendUp: true,
      href: "/sla-dashboard",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your operations and compliance metrics
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="gradient" onClick={() => router.push("/incidents?create=1")} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Incident
          </Button>
          <Button variant="glass" onClick={() => router.push("/sla-dashboard")} size="sm">
            <Gauge className="h-4 w-4 mr-1" />
            SLA Dashboard
          </Button>
          <Button variant="glass" onClick={() => router.push("/reports")} size="sm">
            <BarChart3 className="h-4 w-4 mr-1" />
            Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards with drill-down links */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card variant="glass" className="group relative overflow-hidden animate-slide-up hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{card.value}</div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                    {card.trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {card.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Major Incident Strip and Service Risk */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "180ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Major Incident Strip
              </span>
              <span className="text-sm text-muted-foreground">
                Active: {data.majorIncidentSummary?.activeCount ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.majorIncidentSummary?.incidents || []).map((incident) => (
              <div
                key={incident.id}
                className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={() => router.push(`/incidents/${incident.id}`)}
                  >
                    {incident.ticketNumber ? `${incident.ticketNumber} · ` : ""}{incident.title}
                  </button>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs capitalize">
                    Bridge {incident.bridgeStatus}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Commander: {incident.commander}</span>
                  <span className="capitalize">Priority: {incident.priority}</span>
                  {incident.affectedServices.length > 0 && (
                    <span>Services: {incident.affectedServices.join(", ")}</span>
                  )}
                </div>
              </div>
            ))}
            {(!data.majorIncidentSummary?.incidents || data.majorIncidentSummary.incidents.length === 0) && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All clear</p>
                <p className="text-xs text-muted-foreground mt-1">No active major incidents at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "220ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5 text-amber-500" />
              Top-Risk Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.topRiskServices || []).map((service) => (
              <div key={service.name} className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{service.name}</p>
                  <span className="text-sm font-semibold text-rose-500">{service.riskScore}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Owner: {service.ownerTeam}
                </p>
                <p className="text-xs text-muted-foreground">
                  Open {service.openIncidents} · Major {service.majorIncidents} · At risk {service.atRiskIncidents}
                </p>
              </div>
            ))}
            {(!data.topRiskServices || data.topRiskServices.length === 0) && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-amber-500" />
                </div>
                <p className="text-sm font-medium">No service risk data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Risk scores will appear once services are configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SLA Targets & CIR Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "250ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-cyan-500" />
              SLA Targets by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.slaTargets || []).length > 0 ? (
                (data.slaTargets || []).map((target) => (
                  <div key={target.priority} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                    <span className="capitalize font-medium">{target.priority}</span>
                    <div className="text-sm text-muted-foreground">
                      Response: {target.responseTimeMins}m · Resolution: {target.resolutionTimeMins}m
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Target className="h-6 w-6 text-cyan-500" />
                  </div>
                  <p className="text-sm font-medium">No SLA targets configured</p>
                  <p className="text-xs text-muted-foreground mt-1">Define response and resolution targets by priority</p>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => router.push("/sla-dashboard")}>
                View SLA Dashboard →
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-amber-500" />
              Continual Improvement Register (CIR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track improvement initiatives aligned with ITIL 4 Continual Improvement practice.
            </p>
            <div className="space-y-2">
              <div className="rounded-xl bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Improvement initiatives:</span> Track via Problems, Reports, and Audit Logs
              </div>
              <Button variant="glass" size="sm" onClick={() => router.push("/problems")}>
                View Problems
              </Button>
              <Button variant="glass" size="sm" onClick={() => router.push("/reports")} className="ml-2">
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified System Correlation */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusMatrix
          title="Cross-Domain System Coverage"
          items={[
            {
              name: "Linked Task Coverage",
              value: data.crossDomain?.linkageCoveragePercent ?? 0,
              target: 100,
              hint: "Tasks linked to incident/workflow/violation/policy/source entities",
            },
            {
              name: "Workflow Records",
              value: data.crossDomain?.workflows ?? 0,
              hint: "Incident-linked workflow instances",
            },
            {
              name: "Audit Logs (7d)",
              value: data.crossDomain?.auditLogsLast7Days ?? 0,
              hint: "Recent immutable mutation events",
            },
          ]}
        />

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Network className="h-5 w-5 text-cyan-500" />
              Unified Record Counts
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Tasks</div>
              <div className="text-xl font-semibold">{data.crossDomain?.tasks ?? 0}</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Workflows</div>
              <div className="text-xl font-semibold">{data.crossDomain?.workflows ?? 0}</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Violations</div>
              <div className="text-xl font-semibold">{data.crossDomain?.violations ?? 0}</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Audit (7d)</div>
              <div className="text-xl font-semibold">{data.crossDomain?.auditLogsLast7Days ?? 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "350ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Linked Activity Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.recentActivity || []).slice(0, 4).map((activity) => (
              <div key={activity.id} className="rounded-xl bg-muted/40 p-3 space-y-1">
                <div className="text-sm font-medium">{activity.title}</div>
                <SystemRecordBadge value={activity.systemRecordId} compact />
              </div>
            ))}
            {(!data.recentActivity || data.recentActivity.length === 0) && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-violet-500" />
                </div>
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">Cross-domain activity will appear here</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="glass" onClick={() => router.push("/workflows")}>
                <FileSearch className="h-4 w-4" />
                Workflows
              </Button>
              <Button variant="glass" onClick={() => router.push("/audit-logs")}>
                <FileSearch className="h-4 w-4" />
                Audit Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <TrendingUp className="h-5 w-5 text-violet-500" />
              </div>
              Incident Trend (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              {data.trendData.length > 0 ? (
                <div className="w-full space-y-2">
                  {data.trendData.slice(-7).map((d) => (
                    <div key={d.date} className="flex items-center gap-4 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground w-24">{d.date}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${d.created * 10}%` }} />
                        <span className="text-xs text-muted-foreground w-16">Created: {d.created}</span>
                      </div>
                      <span className="text-xs text-emerald-500 w-20">Resolved: {d.resolved}</span>
                    </div>
                  ))}
                </div>
              ) : (
                "No trend data available"
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Avg Resolution Time</span>
                <span className="text-2xl font-bold gradient-text">
                  {data.avgResolutionTimeHours}h
                </span>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Incidents by Status
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(data.incidentsByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground capitalize mt-1">
                        {status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
