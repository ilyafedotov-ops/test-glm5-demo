"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSearch,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusMatrix } from "@/components/operations/status-matrix";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";
import { OperationsPageHeader } from "@/components/operations/page-header";
import { OperationsMetricCard } from "@/components/operations/metric-card";

type ReportType =
  | "incident_summary"
  | "sla_compliance"
  | "user_activity"
  | "audit_log"
  | "itil_kpi"
  | "incident_lifecycle"
  | "workflow_kpi";
type ReportFormat = "csv" | "json";
type ReportWindow = "last_24h" | "last_7d" | "last_30d" | "quarter_to_date";
type ReportScheduleFrequency = "none" | "daily" | "weekly" | "monthly";

interface Report {
  id: ReportType;
  name: string;
  description: string;
  lastRun: string;
  status: string;
}

interface ReportJob {
  id: string;
  type: ReportType;
  format: ReportFormat;
  status: string;
  downloadUrl: string | null;
  createdAt: string;
  requestedBy?: { firstName: string; lastName: string };
  parameters?: Record<string, unknown>;
}

interface CorrelationMap {
  crossDomain: {
    tasks: number;
    workflows: number;
    violations: number;
    auditLogsLast7Days: number;
    linkageCoveragePercent: number;
  };
  recentActivity: Array<{
    id: string;
    systemRecordId: string;
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
  }>;
}

interface ReportTemplate {
  name: string;
  description: string;
  kpiFocus: string;
  icon: typeof BarChart3;
  gradient: string;
}

const REPORT_LIBRARY: Record<ReportType, ReportTemplate> = {
  incident_summary: {
    name: "Incident Summary",
    description: "Operational overview of incident volume, priority mix, and service health trends.",
    kpiFocus: "Queue load, MTTR trend proxy, priority distribution",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-500",
  },
  sla_compliance: {
    name: "SLA Compliance",
    description: "SLA attainment and breach analysis by response and resolution commitments.",
    kpiFocus: "Response SLA %, Resolution SLA %, breach hotspots",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-teal-500",
  },
  user_activity: {
    name: "User Activity",
    description: "Analyst and operator activity coverage across workflow, incident, and compliance work.",
    kpiFocus: "Action throughput, adoption, analyst activity footprint",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
  },
  audit_log: {
    name: "Audit Log",
    description: "Event export for evidence packaging, compliance attestations, and transition traceability.",
    kpiFocus: "Immutable event history, transition evidence, control auditability",
    icon: FileSearch,
    gradient: "from-blue-500 to-indigo-500",
  },
  itil_kpi: {
    name: "ITIL KPI",
    description: "Core ITIL KPI dataset including MTTA, MTTR, open backlog, and SLA attainment.",
    kpiFocus: "MTTA, MTTR, SLA attainment, backlog health",
    icon: BarChart3,
    gradient: "from-cyan-500 to-blue-500",
  },
  incident_lifecycle: {
    name: "Incident Lifecycle",
    description: "State transition analytics from intake through closure with bottleneck visibility.",
    kpiFocus: "Transition throughput and lifecycle bottlenecks",
    icon: Calendar,
    gradient: "from-fuchsia-500 to-violet-500",
  },
  workflow_kpi: {
    name: "Workflow KPI",
    description: "Workflow completion and step-level task orchestration metrics.",
    kpiFocus: "Workflow completion and correlated task flow",
    icon: FileText,
    gradient: "from-emerald-500 to-lime-500",
  },
};

const STATUS_META: Record<string, { gradient: string; label: string; badge: "success" | "warning" | "error" | "info" }> = {
  pending: { gradient: "from-amber-500 to-orange-500", label: "Pending", badge: "warning" },
  processing: { gradient: "from-blue-500 to-indigo-500", label: "Processing", badge: "info" },
  completed: { gradient: "from-emerald-500 to-teal-500", label: "Completed", badge: "success" },
  scheduled: { gradient: "from-cyan-500 to-blue-500", label: "Scheduled", badge: "info" },
  failed: { gradient: "from-rose-500 to-pink-500", label: "Failed", badge: "error" },
};

async function fetchReports(token: string): Promise<Report[]> {
  const res = await fetch(`${API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

async function fetchReportJobs(
  token: string,
  filters?: { status?: string; type?: string; format?: string }
): Promise<{ data: ReportJob[] }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.format) params.set("format", filters.format);
  const query = params.toString();

  const res = await fetch(`${API_URL}/reports/jobs${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch report jobs");
  return res.json();
}

async function runReport(
  token: string,
  type: ReportType,
  format: ReportFormat,
  parameters: Record<string, unknown>,
  scheduleFrequency: ReportScheduleFrequency,
  scheduleStartAt?: string
) {
  const res = await fetch(`${API_URL}/reports/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      format,
      parameters,
      scheduleFrequency,
      scheduleStartAt: scheduleFrequency !== "none" ? scheduleStartAt : undefined,
    }),
  });
  if (!res.ok) throw new Error("Failed to run report");
  return res.json();
}

async function fetchCorrelationMap(token: string): Promise<CorrelationMap> {
  const res = await fetch(`${API_URL}/dashboard/correlation-map`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch correlation map");
  return res.json();
}

function generateMockReportContent(type: ReportType, format: ReportFormat) {
  const now = new Date().toISOString();

  const data: Record<ReportType, Record<string, unknown>> = {
    incident_summary: {
      totalIncidents: 24,
      activeIncidents: 9,
      criticalIncidents: 3,
      byPriority: { critical: 3, high: 6, medium: 10, low: 5 },
      generatedAt: now,
    },
    sla_compliance: {
      responseSlaPercent: 94.1,
      resolutionSlaPercent: 91.6,
      breaches: 4,
      onTimeResponses: 45,
      onTimeResolutions: 39,
      generatedAt: now,
    },
    user_activity: {
      activeAnalysts: 11,
      totalActions: 312,
      topActions: ["update_incident", "run_report", "transition_workflow"],
      generatedAt: now,
    },
    audit_log: {
      totalEvents: 186,
      transitionEvents: 59,
      complianceEvents: 37,
      accessEvents: 29,
      generatedAt: now,
    },
    itil_kpi: {
      totalIncidents: 24,
      mttaMinutes: 18.6,
      mttrMinutes: 204.2,
      responseComplianceRate: 94.1,
      resolutionComplianceRate: 91.6,
      generatedAt: now,
    },
    incident_lifecycle: {
      newToAssigned: 42,
      assignedToInProgress: 37,
      inProgressToResolved: 31,
      resolvedToClosed: 28,
      generatedAt: now,
    },
    workflow_kpi: {
      totalWorkflows: 18,
      completedWorkflows: 14,
      workflowTaskCompletionRate: 88.5,
      generatedAt: now,
    },
  };

  if (format === "json") {
    return JSON.stringify(data[type], null, 2);
  }

  return Object.entries(data[type])
    .map(([key, value]) => `${key},${JSON.stringify(value)}`)
    .join("\n");
}

export default function ReportsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [jobFormatFilter, setJobFormatFilter] = useState("");
  const [formData, setFormData] = useState<{
    type: ReportType;
    format: ReportFormat;
    window: ReportWindow;
    includeEvidence: "yes" | "no";
    scheduleFrequency: ReportScheduleFrequency;
    scheduleStartAt: string;
  }>({
    type: "incident_summary",
    format: "json",
    window: "last_7d",
    includeEvidence: "yes",
    scheduleFrequency: "none",
    scheduleStartAt: "",
  });

  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchReports(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["report-jobs", jobStatusFilter, jobTypeFilter, jobFormatFilter],
    queryFn: () =>
      fetchReportJobs(token!, {
        status: jobStatusFilter || undefined,
        type: jobTypeFilter || undefined,
        format: jobFormatFilter || undefined,
      }),
    enabled: isAuthenticated && !!token,
  });

  const { data: correlationMap } = useQuery({
    queryKey: ["dashboard", "correlation-map"],
    queryFn: () => fetchCorrelationMap(token!),
    enabled: isAuthenticated && !!token,
  });

  const runMutation = useMutation({
    mutationFn: () =>
      runReport(token!, formData.type, formData.format, {
        window: formData.window,
        includeEvidence: formData.includeEvidence === "yes",
      }, formData.scheduleFrequency, formData.scheduleStartAt || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
      setDialogOpen(false);
      addToast({
        type: "success",
        title: "Report generated",
        description: "The report job has been generated and queued for download.",
      });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to generate report" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runMutation.mutate();
  };

  const handleDownload = (job: ReportJob) => {
    if (!job.downloadUrl) return;

    const content = generateMockReportContent(job.type, job.format);
    const blob = new Blob([content], {
      type: job.format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.type}_${new Date().toISOString().split("T")[0]}.${job.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({ type: "success", title: "Download started" });
  };

  const refreshAll = () => {
    refetchReports();
    refetchJobs();
  };

  const jobs = jobsData?.data || [];

  const filteredJobs = jobs;

  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const pendingJobs = jobs.filter(
    (job) => job.status === "pending" || job.status === "processing" || job.status === "scheduled"
  ).length;
  const successRate = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

  const selectedTemplate = REPORT_LIBRARY[formData.type];

  const kpiItems = useMemo(
    () => [
      {
        name: "Reporting Success Rate",
        value: successRate,
        target: 100,
        hint: "Completed jobs out of total generated jobs",
      },
      {
        name: "Pending Workload",
        value: pendingJobs,
        hint: "Jobs waiting or processing",
      },
      {
        name: "Cross-domain Linkage",
        value: correlationMap?.crossDomain.linkageCoveragePercent ?? 0,
        target: 100,
        hint: "Evidence readiness across modules",
      },
    ],
    [correlationMap?.crossDomain.linkageCoveragePercent, pendingJobs, successRate]
  );

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <OperationsPageHeader
        title="Reports"
        description="ITIL-aligned reporting workspace for operational KPIs, SLA health, and audit evidence packs."
        actions={
          <>
            <Button variant="glass" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="gradient" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Run Report
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetricCard
          label="Available Templates"
          value={reports?.length || 0}
          icon={FileText}
          tone="violet"
        />
        <OperationsMetricCard
          label="Completed Jobs"
          value={completedJobs}
          icon={CheckCircle}
          tone="emerald"
          valueClassName="text-emerald-500"
        />
        <OperationsMetricCard
          label="Pending Jobs"
          value={pendingJobs}
          icon={Clock}
          tone="amber"
          valueClassName="text-amber-500"
        />
        <OperationsMetricCard
          label="Failed Jobs"
          value={failedJobs}
          icon={XCircle}
          tone="rose"
          valueClassName="text-rose-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusMatrix title="ITIL Reporting KPI Matrix" items={kpiItems} />

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Linked Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(correlationMap?.recentActivity || []).slice(0, 4).map((activity) => (
              <div key={activity.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="text-sm font-medium">{activity.title}</div>
                <div className="mt-1">
                  <SystemRecordBadge value={activity.systemRecordId} compact />
                </div>
              </div>
            ))}
            {(!correlationMap?.recentActivity || correlationMap.recentActivity.length === 0) && (
              <div className="text-sm text-muted-foreground">No recent linked activity</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-2">
              <FileText className="h-5 w-5 text-violet-500" />
            </div>
            ITIL Report Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-muted/50 shimmer" />
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((report, index) => {
                const template = REPORT_LIBRARY[report.id] || REPORT_LIBRARY.incident_summary;
                const Icon = template.icon;
                return (
                  <div
                    key={report.id}
                    className="group cursor-pointer rounded-xl border border-white/20 bg-white/30 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/50 hover:shadow-lg dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      setFormData((current) => ({ ...current, type: report.id }));
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${template.gradient} shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">KPI focus: {template.kpiFocus}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Last run: {new Date(report.lastRun).toLocaleDateString()}
                          </span>
                          <Badge variant="success" className="text-xs">
                            {report.status}
                          </Badge>
                        </div>
                      </div>
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
              <p className="text-lg font-medium">No reports available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-lg">
            <span className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-2">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              Recent Report Jobs
            </span>
            <div className="grid w-full gap-2 md:max-w-[680px] md:grid-cols-3">
              <Select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "processing", label: "Processing" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "completed", label: "Completed" },
                  { value: "failed", label: "Failed" },
                ]}
              />
              <Select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                options={[
                  { value: "", label: "All report types" },
                  { value: "incident_summary", label: "Incident Summary" },
                  { value: "sla_compliance", label: "SLA Compliance" },
                  { value: "user_activity", label: "User Activity" },
                  { value: "audit_log", label: "Audit Log" },
                  { value: "itil_kpi", label: "ITIL KPI" },
                  { value: "incident_lifecycle", label: "Incident Lifecycle" },
                  { value: "workflow_kpi", label: "Workflow KPI" },
                ]}
              />
              <Select
                value={jobFormatFilter}
                onChange={(e) => setJobFormatFilter(e.target.value)}
                options={[
                  { value: "", label: "All formats" },
                  { value: "json", label: "JSON" },
                  { value: "csv", label: "CSV" },
                ]}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/50 shimmer" />
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.slice(0, 10).map((job) => {
                const template = REPORT_LIBRARY[job.type] || REPORT_LIBRARY.incident_summary;
                const status = STATUS_META[job.status] || {
                  gradient: "from-slate-500 to-gray-500",
                  label: job.status,
                  badge: "info" as const,
                };
                const Icon = template.icon;

                return (
                  <div
                    key={job.id}
                    className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-4 transition-all hover:bg-white/50 dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                          <Icon className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{template.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              .{job.format}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                            {job.requestedBy ? <span>by {job.requestedBy.firstName} {job.requestedBy.lastName}</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`bg-gradient-to-r ${status.gradient} border-0 text-white`}>
                          {status.label}
                        </Badge>
                        {job.status === "completed" ? (
                          <Button variant="glass" size="sm" onClick={() => handleDownload(job)}>
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {job.status === "scheduled" &&
                        (job.parameters as { schedule?: { frequency?: string; startAt?: string } })?.schedule && (
                          <div className="text-xs text-muted-foreground">
                            Scheduled{" "}
                            {(job.parameters as { schedule?: { frequency?: string } })?.schedule?.frequency || "recurring"}
                            {(
                              job.parameters as { schedule?: { startAt?: string } }
                            )?.schedule?.startAt
                              ? ` · starts ${new Date(
                                  (
                                    job.parameters as { schedule?: { startAt?: string } }
                                  ).schedule!.startAt!
                                ).toLocaleString()}`
                              : ""}
                          </div>
                        )}
                      <SystemRecordBadge value={`report_job:${job.id}`} compact />
                      <RelatedRecordList
                        records={[
                          { type: "report_job", id: job.id, systemRecordId: `report_job:${job.id}`, relationship: "job_record" },
                          ...(job.type === "incident_summary"
                            ? [{ type: "incident", id: "summary", systemRecordId: "incident:summary", relationship: "summarizes" }]
                            : []),
                          ...(job.type === "audit_log"
                            ? [{ type: "audit_log", id: "export", systemRecordId: "audit_log:export", relationship: "exports" }]
                            : []),
                          ...(job.type === "itil_kpi"
                            ? [{ type: "incident", id: "kpi", systemRecordId: "incident:kpi", relationship: "analyzes_kpi" }]
                            : []),
                          ...(job.type === "workflow_kpi"
                            ? [{ type: "workflow", id: "kpi", systemRecordId: "workflow:kpi", relationship: "analyzes_workflows" }]
                            : []),
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <p className="text-muted-foreground">No report jobs for selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Run ITIL Report">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Report Type"
            value={formData.type}
            onChange={(e) => setFormData((current) => ({ ...current, type: e.target.value as ReportType }))}
            options={[
              { value: "incident_summary", label: "Incident Summary" },
              { value: "sla_compliance", label: "SLA Compliance" },
              { value: "user_activity", label: "User Activity" },
              { value: "audit_log", label: "Audit Log" },
              { value: "itil_kpi", label: "ITIL KPI" },
              { value: "incident_lifecycle", label: "Incident Lifecycle" },
              { value: "workflow_kpi", label: "Workflow KPI" },
            ]}
          />

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-medium">{selectedTemplate.name}</p>
            <p className="mt-1 text-muted-foreground">{selectedTemplate.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">KPI focus: {selectedTemplate.kpiFocus}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Format"
              value={formData.format}
              onChange={(e) => setFormData((current) => ({ ...current, format: e.target.value as ReportFormat }))}
              options={[
                { value: "json", label: "JSON" },
                { value: "csv", label: "CSV" },
              ]}
            />
            <Select
              label="Time Window"
              value={formData.window}
              onChange={(e) => setFormData((current) => ({ ...current, window: e.target.value as ReportWindow }))}
              options={[
                { value: "last_24h", label: "Last 24 hours" },
                { value: "last_7d", label: "Last 7 days" },
                { value: "last_30d", label: "Last 30 days" },
                { value: "quarter_to_date", label: "Quarter to date" },
              ]}
            />
          </div>

          <Select
            label="Include Evidence Fields"
            value={formData.includeEvidence}
            onChange={(e) => setFormData((current) => ({ ...current, includeEvidence: e.target.value as "yes" | "no" }))}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />

          <Select
            label="Schedule"
            value={formData.scheduleFrequency}
            onChange={(e) =>
              setFormData((current) => ({
                ...current,
                scheduleFrequency: e.target.value as ReportScheduleFrequency,
              }))
            }
            options={[
              { value: "none", label: "Run now" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />

          {formData.scheduleFrequency !== "none" && (
            <label className="block text-sm">
              <span className="text-muted-foreground">Schedule Start</span>
              <input
                type="datetime-local"
                value={formData.scheduleStartAt}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    scheduleStartAt: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={runMutation.isPending}>
              {runMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
