"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, AlertCircle, BarChart3, ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { SLAIndicator } from "@/components/ui/sla-indicator";
import { TicketNumberBadge } from "@/components/ui/ticket-badge";
import { useToastStore } from "@/stores/toast-store";

interface SLAMetrics {
  overview: {
    totalIncidents: number;
    responseSLACompliance: string;
    resolutionSLACompliance: string;
    responseSLAMet: number;
    resolutionSLAMet: number;
  };
  breaches: {
    response: number;
    resolution: number;
    total: number;
    incidents: any[];
  };
  atRisk: {
    response: number;
    resolution: number;
    total: number;
    incidents: any[];
  };
  byPriority: Record<string, {
    total: number;
    responseCompliance: string;
    resolutionCompliance: string;
  }>;
  dailyTrend: Array<{
    date: string;
    total: number;
    responseCompliance: string;
    resolutionCompliance: string;
  }>;
}

interface SLATarget {
  id?: string;
  priority: "critical" | "high" | "medium" | "low";
  name: string;
  description?: string;
  responseTimeMins: number;
  resolutionTimeMins: number;
  businessHoursOnly: boolean;
  isActive: boolean;
}

async function fetchSLAMetrics(token: string, period: string): Promise<SLAMetrics> {
  const res = await fetch(`${API_URL}/dashboard/sla/metrics?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch SLA metrics");
  return res.json();
}

async function fetchSLATargets(token: string): Promise<SLATarget[]> {
  const res = await fetch(`${API_URL}/dashboard/sla/targets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch SLA targets");
  return res.json();
}

async function updateSLATargets(token: string, targets: SLATarget[]) {
  const res = await fetch(`${API_URL}/dashboard/sla/targets`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targets }),
  });
  if (!res.ok) throw new Error("Failed to update SLA targets");
  return res.json();
}

export default function SLADashboardPage() {
  const { token, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [period, setPeriod] = useState("7d");
  const [editableTargets, setEditableTargets] = useState<SLATarget[]>([]);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["sla-metrics", period],
    queryFn: () => fetchSLAMetrics(token!, period),
    enabled: isAuthenticated && !!token,
  });

  const { data: targets } = useQuery({
    queryKey: ["sla-targets"],
    queryFn: () => fetchSLATargets(token!),
    enabled: isAuthenticated && !!token,
  });

  const updateTargetsMutation = useMutation({
    mutationFn: () => updateSLATargets(token!, editableTargets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-targets"] });
      addToast({ type: "success", title: "SLA targets updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update targets", description: err.message });
    },
  });

  const isAdminUser =
    !!user &&
    (user.roles?.some((role) => role.name === "admin") ||
      user.permissions?.some((permission) => permission.name === "admin:all"));

  useEffect(() => {
    if (targets && editableTargets.length === 0) {
      setEditableTargets(targets);
    }
  }, [targets, editableTargets.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const complianceRate = (value: string) => {
    const num = parseFloat(value);
    if (num >= 95) return { color: "text-emerald-600", bg: "bg-emerald-500/10" };
    if (num >= 85) return { color: "text-amber-600", bg: "bg-amber-500/10" };
    return { color: "text-rose-600", bg: "bg-rose-500/10" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLA Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor SLA compliance and performance
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Incidents</span>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{metrics?.overview.totalIncidents || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Response SLA</span>
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <p className={`text-3xl font-bold ${
              complianceRate(metrics?.overview.responseSLACompliance || "0").color
            }`}>
              {metrics?.overview.responseSLACompliance || "0%"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.overview.responseSLAMet || 0} met
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Resolution SLA</span>
              <CheckCircle className="h-5 w-5 text-purple-500" />
            </div>
            <p className={`text-3xl font-bold ${
              complianceRate(metrics?.overview.resolutionSLACompliance || "0").color
            }`}>
              {metrics?.overview.resolutionSLACompliance || "0%"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.overview.resolutionSLAMet || 0} met
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Breached</span>
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-3xl font-bold text-rose-600">
              {metrics?.breaches.total || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.atRisk.total || 0} at risk
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.byPriority && Object.entries(metrics.byPriority).map(([priority, data]) => {
                const responseStyle = complianceRate(data.responseCompliance);
                const resolutionStyle = complianceRate(data.resolutionCompliance);

                return (
                  <div key={priority} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold capitalize">{priority}</p>
                      <p className="text-sm text-muted-foreground">{data.total} incidents</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Response</p>
                        <p className={`text-lg font-semibold ${responseStyle.color}`}>
                          {data.responseCompliance}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Resolution</p>
                        <p className={`text-lg font-semibold ${resolutionStyle.color}`}>
                          {data.resolutionCompliance}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.dailyTrend && metrics.dailyTrend.slice(-7).map((day) => {
                const responseStyle = complianceRate(day.responseCompliance);
                const resolutionStyle = complianceRate(day.resolutionCompliance);

                return (
                  <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{day.total} incidents</p>
                    </div>
                    <div className="flex gap-4">
                      <div className={`px-3 py-1 rounded-lg ${responseStyle.bg}`}>
                        <span className={`text-sm font-medium ${responseStyle.color}`}>
                          {day.responseCompliance}%
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${resolutionStyle.bg}`}>
                        <span className={`text-sm font-medium ${resolutionStyle.color}`}>
                          {day.resolutionCompliance}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At Risk and Breached */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                At Risk
              </CardTitle>
              <Badge variant="warning">{metrics?.atRisk.total || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {metrics?.atRisk.incidents && metrics.atRisk.incidents.length > 0 ? (
              <div className="space-y-3">
                {metrics.atRisk.incidents.slice(0, 5).map((incident: any) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <div>
                      <TicketNumberBadge ticketNumber={incident.ticketNumber} compact />
                      <p className="font-medium mt-1">{incident.title}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">{incident.priority}</Badge>
                      {incident.slaResponseDue && (
                        <SLAIndicator dueAt={incident.slaResponseDue} type="response" compact />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No at-risk SLAs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breached */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Breached
              </CardTitle>
              <Badge variant="destructive">{metrics?.breaches.total || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {metrics?.breaches.incidents && metrics.breaches.incidents.length > 0 ? (
              <div className="space-y-3">
                {metrics.breaches.incidents.slice(0, 5).map((incident: any) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <div>
                      <TicketNumberBadge ticketNumber={incident.ticketNumber} compact />
                      <p className="font-medium mt-1">{incident.title}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{incident.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No breached SLAs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdminUser && (
        <Card>
          <CardHeader>
            <CardTitle>SLA Target Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editableTargets.map((target, index) => (
              <div key={target.priority} className="rounded-lg border border-white/10 bg-muted/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold capitalize">{target.priority}</p>
                  <label className="flex items-center gap-2 text-sm">
                    <span>Active</span>
                    <input
                      type="checkbox"
                      checked={target.isActive}
                      onChange={(event) =>
                        setEditableTargets((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isActive: event.target.checked } : item
                          )
                        )
                      }
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-muted-foreground">Response (mins)</span>
                    <input
                      type="number"
                      min={1}
                      value={target.responseTimeMins}
                      onChange={(event) =>
                        setEditableTargets((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, responseTimeMins: Number(event.target.value) || 1 }
                              : item
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted-foreground">Resolution (mins)</span>
                    <input
                      type="number"
                      min={1}
                      value={target.resolutionTimeMins}
                      onChange={(event) =>
                        setEditableTargets((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, resolutionTimeMins: Number(event.target.value) || 1 }
                              : item
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2"
                    />
                  </label>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                variant="gradient"
                onClick={() => updateTargetsMutation.mutate()}
                disabled={updateTargetsMutation.isPending || editableTargets.length === 0}
              >
                {updateTargetsMutation.isPending ? "Saving..." : "Save SLA Targets"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
