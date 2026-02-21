"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowRightLeft,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Sheet } from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusMatrix } from "@/components/operations/status-matrix";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";
import { OperationsPageHeader } from "@/components/operations/page-header";
import { OperationsMetricCard } from "@/components/operations/metric-card";

type AuditEventClass = "all" | "transition" | "compliance" | "access" | "change" | "other";

interface AuditLogDiff {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  changeType: "added" | "removed" | "modified";
}

interface AuditLog {
  id: string;
  actorId?: string;
  actorType: string;
  actorName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  diffs?: AuditLogDiff[];
  ipAddress?: string;
  correlationId: string;
  systemRecordId?: string;
  relatedRecords?: Array<{
    type: string;
    id: string;
    systemRecordId: string;
    relationship?: string;
  }>;
  createdAt: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AuditStats {
  totalLogs: number;
  todayCount: number;
  topActions: { action: string; count: number }[];
  topResources: { resource: string; count: number }[];
  topActors: { actorId: string; actorName: string; count: number }[];
}

interface CorrelationMap {
  crossDomain: {
    tasks: number;
    workflows: number;
    violations: number;
    auditLogsLast7Days: number;
    linkageCoveragePercent: number;
  };
}

interface AuditQueryParams {
  page?: number;
  action?: string;
  resource?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

const actionConfig: Record<string, { icon: typeof Edit; color: string; bg: string }> = {
  create: { icon: Plus, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  update: { icon: Edit, color: "text-blue-600", bg: "bg-blue-500/10" },
  delete: { icon: Trash2, color: "text-rose-600", bg: "bg-rose-500/10" },
  read: { icon: Eye, color: "text-slate-600", bg: "bg-slate-500/10" },
  login: { icon: LogIn, color: "text-violet-600", bg: "bg-violet-500/10" },
  logout: { icon: User, color: "text-orange-600", bg: "bg-orange-500/10" },
};

const eventClassLabel: Record<AuditEventClass, string> = {
  all: "All Events",
  transition: "Transitions",
  compliance: "Compliance",
  access: "Access",
  change: "Changes",
  other: "Other",
};

async function fetchAuditLogs(token: string, params: AuditQueryParams): Promise<AuditLogResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.action) searchParams.set("action", params.action);
  if (params.resource) searchParams.set("resource", params.resource);
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`${API_URL}/audit-logs?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

async function fetchAuditStats(token: string): Promise<AuditStats> {
  const res = await fetch(`${API_URL}/audit-logs/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchAuditLogDetail(token: string, id: string): Promise<AuditLog & { diffs: AuditLogDiff[] }> {
  const res = await fetch(`${API_URL}/audit-logs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch log details");
  return res.json();
}

async function fetchCorrelationMap(token: string): Promise<CorrelationMap> {
  const res = await fetch(`${API_URL}/dashboard/correlation-map`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch correlation map");
  return res.json();
}

function classifyAuditEvent(log: AuditLog): AuditEventClass {
  const action = log.action.toLowerCase();
  const resource = log.resource.toLowerCase();

  const transitionSignals = ["transition", "status", "assign", "approve", "reject", "resolve", "close", "escalat"];
  if (transitionSignals.some((signal) => action.includes(signal))) {
    return "transition";
  }

  const complianceSignals = ["compliance", "policy", "violation", "control", "audit"];
  if (complianceSignals.some((signal) => action.includes(signal) || resource.includes(signal))) {
    return "compliance";
  }

  const accessSignals = ["login", "logout", "auth", "permission", "role"];
  if (accessSignals.some((signal) => action.includes(signal))) {
    return "access";
  }

  const changeSignals = ["create", "update", "delete", "patch", "modify"];
  if (changeSignals.some((signal) => action.includes(signal))) {
    return "change";
  }

  return "other";
}

function getActionStyle(action: string) {
  const key = action.toLowerCase();
  return actionConfig[key] ?? { icon: ArrowRightLeft, color: "text-gray-600", bg: "bg-gray-500/10" };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function formatEventTitle(log: AuditLog): string {
  const action = log.action.replace(/_/g, " ");
  return `${action.charAt(0).toUpperCase()}${action.slice(1)} on ${log.resource}`;
}

export default function AuditLogsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterResource, setFilterResource] = useState("");
  const [eventClass, setEventClass] = useState<AuditEventClass>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, filterAction, filterResource, fromDate, toDate, searchTerm],
    queryFn: () =>
      fetchAuditLogs(token!, {
        page,
        action: filterAction || undefined,
        resource: filterResource || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: searchTerm || undefined,
      }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["audit-logs", "stats"],
    queryFn: () => fetchAuditStats(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: logDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["audit-logs", selectedLog?.id],
    queryFn: () => fetchAuditLogDetail(token!, selectedLog!.id),
    enabled: !!selectedLog?.id && isAuthenticated && !!token,
    retry: false,
  });

  const { data: correlationMap } = useQuery({
    queryKey: ["dashboard", "correlation-map"],
    queryFn: () => fetchCorrelationMap(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  if (!isAuthenticated) return null;

  const logs = data?.data || [];

  const classifiedLogs = logs.map((log) => ({
    log,
    eventClass: classifyAuditEvent(log),
  }));

  const eventCounts = classifiedLogs.reduce(
    (acc, item) => {
      acc[item.eventClass] += 1;
      return acc;
    },
    { transition: 0, compliance: 0, access: 0, change: 0, other: 0 }
  );

  const filteredLogs = classifiedLogs
    .filter((item) => (eventClass === "all" ? true : item.eventClass === eventClass))
    .map((item) => item.log);

  const complianceEvents = eventCounts.compliance;
  const transitionEvents = eventCounts.transition;
  const handleExport = async () => {
    const searchParams = new URLSearchParams();
    if (filterAction) searchParams.set("action", filterAction);
    if (filterResource) searchParams.set("resource", filterResource);
    if (fromDate) searchParams.set("fromDate", fromDate);
    if (toDate) searchParams.set("toDate", toDate);
    if (searchTerm) searchParams.set("search", searchTerm);

    const res = await fetch(`${API_URL}/audit-logs/export?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <OperationsPageHeader
        title="Audit Logs"
        description="Event-oriented audit timeline with transition and compliance semantics for control evidence."
        actions={
          <>
            <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="glass" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetricCard
          label="Total Events"
          value={stats?.totalLogs?.toLocaleString() || 0}
          icon={FileText}
          tone="violet"
        />
        <OperationsMetricCard
          label="Today"
          value={stats?.todayCount || 0}
          icon={Clock}
          tone="blue"
          valueClassName="text-blue-500"
        />
        <OperationsMetricCard
          label="Transition Events"
          value={transitionEvents}
          icon={ArrowRightLeft}
          tone="amber"
          valueClassName="text-amber-500"
        />
        <OperationsMetricCard
          label="Compliance Events"
          value={complianceEvents}
          icon={ShieldCheck}
          tone="emerald"
          valueClassName="text-emerald-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusMatrix
          title="Audit Event Health"
          items={[
            {
              name: "Audit Logs (Today)",
              value: stats?.todayCount ?? 0,
              hint: "All immutable events recorded today",
            },
            {
              name: "Audit Logs (7d)",
              value: correlationMap?.crossDomain.auditLogsLast7Days ?? 0,
              hint: "Recent auditable activity",
            },
            {
              name: "Cross-domain Linkage",
              value: correlationMap?.crossDomain.linkageCoveragePercent ?? 0,
              target: 100,
              hint: "Linked records across platform entities",
            },
          ]}
        />

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Actors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.topActors || []).slice(0, 5).map((actor) => (
              <div key={actor.actorId} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">{actor.actorName}</span>
                <Badge variant="secondary">{actor.count}</Badge>
              </div>
            ))}
            {(!stats?.topActors || stats.topActors.length === 0) && (
              <div className="text-sm text-muted-foreground">No actor activity yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-violet-500" />
            Event Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search action/resource"
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Select
              value={filterAction}
              onChange={(e) => {
                setPage(1);
                setFilterAction(e.target.value);
              }}
              options={[
                { value: "", label: "All Actions" },
                { value: "create", label: "Create" },
                { value: "update", label: "Update" },
                { value: "delete", label: "Delete" },
                { value: "status", label: "Status-related" },
                { value: "login", label: "Login" },
              ]}
            />
            <Select
              value={filterResource}
              onChange={(e) => {
                setPage(1);
                setFilterResource(e.target.value);
              }}
              options={[
                { value: "", label: "All Resources" },
                { value: "incident", label: "Incident" },
                { value: "workflow", label: "Workflow" },
                { value: "task", label: "Task" },
                { value: "policy", label: "Policy" },
                { value: "violation", label: "Violation" },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPage(1);
                  setFromDate(e.target.value);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                aria-label="From date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setPage(1);
                  setToDate(e.target.value);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                aria-label="To date"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "transition", "compliance", "access", "change", "other"] as AuditEventClass[]).map((value) => {
              const count =
                value === "all"
                  ? logs.length
                  : value === "transition"
                    ? eventCounts.transition
                    : value === "compliance"
                      ? eventCounts.compliance
                      : value === "access"
                        ? eventCounts.access
                        : value === "change"
                          ? eventCounts.change
                          : eventCounts.other;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventClass(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    eventClass === value
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-700 dark:text-violet-300"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {eventClassLabel[value]} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-2">
              <FileText className="h-5 w-5 text-violet-500" />
            </div>
            Event Timeline ({data?.pagination.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/50 shimmer" />
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const actionStyle = getActionStyle(log.action);
                const ActionIcon = actionStyle.icon;
                const type = classifyAuditEvent(log);

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer rounded-xl border border-white/20 bg-white/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/50 hover:shadow-lg dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${actionStyle.bg} ${actionStyle.color}`}>
                            <ActionIcon className="h-3.5 w-3.5" />
                            {log.action}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {eventClassLabel[type]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {log.resource}
                          </Badge>
                        </div>

                        <div className="text-sm font-semibold">{formatEventTitle(log)}</div>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {log.actorName || "System"}
                          </span>
                        </div>

                        <div className="mt-2">
                          <SystemRecordBadge value={log.systemRecordId || `audit_log:${log.id}`} compact />
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <FileText className="h-8 w-8 text-violet-500" />
              </div>
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting filters or event class.</p>
            </div>
          )}

          {data?.pagination.totalPages && data.pagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * (data.pagination.limit || 50) + 1} to {Math.min(page * (data.pagination.limit || 50), data.pagination.total)} of {data.pagination.total} entries
              </p>
              <div className="flex gap-2">
                <Button variant="glass" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(data.pagination.totalPages, value + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `${formatEventTitle(selectedLog)}` : "Audit Event"}
      >
        {selectedLog ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Timestamp</span>
                <p className="mt-1 font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Actor</span>
                <p className="mt-1 font-medium">{selectedLog.actorName || "System"}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Action</span>
                <p className="mt-1 font-medium capitalize">{selectedLog.action.replace(/_/g, " ")}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Resource</span>
                <p className="mt-1 font-medium capitalize">{selectedLog.resource}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">IP Address</span>
                <p className="mt-1 font-mono text-xs">{selectedLog.ipAddress || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Event Class</span>
                <p className="mt-1 font-medium">{eventClassLabel[classifyAuditEvent(selectedLog)]}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Actor and Correlation</h4>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-xs text-white">
                    {(selectedLog.actorName || "System")
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{selectedLog.actorName || "System"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Correlation ID: <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono">{selectedLog.correlationId}</code>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Unified Record</h4>
              <SystemRecordBadge value={selectedLog.systemRecordId || `audit_log:${selectedLog.id}`} />
              <RelatedRecordList records={selectedLog.relatedRecords || []} />
            </div>

            <Separator />

            {detailLoading ? (
              <div className="h-32 rounded-xl bg-muted/50 shimmer" />
            ) : logDetail?.diffs && logDetail.diffs.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Field Changes</h4>
                <div className="space-y-2">
                  {logDetail.diffs.map((diff, index) => (
                    <div key={`${diff.field}-${index}`} className="rounded-xl border border-white/10 bg-muted/50 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {diff.changeType}
                        </Badge>
                        <span className="text-sm font-medium">{diff.field}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Before:</span>
                          <pre className="mt-1 overflow-x-auto rounded bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                            {formatValue(diff.oldValue)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-muted-foreground">After:</span>
                          <pre className="mt-1 overflow-x-auto rounded bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            {formatValue(diff.newValue)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                No field-level changes recorded
              </div>
            )}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
