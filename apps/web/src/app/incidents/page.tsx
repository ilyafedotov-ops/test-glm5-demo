"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Search,
  User,
  Zap,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityBadge, PriorityMatrixSelector, ImpactUrgencyBadge } from "@/components/ui/priority-matrix";
import { ChannelBadge, TicketNumberBadge } from "@/components/ui/ticket-badge";
import { SLAIndicator } from "@/components/ui/sla-indicator";
import { StatusMatrix } from "@/components/operations/status-matrix";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";
import { OperationsPageHeader } from "@/components/operations/page-header";
import { OperationsMetricCard } from "@/components/operations/metric-card";

type ImpactLevel = "critical" | "high" | "medium" | "low";
type IncidentChannel = "portal" | "email" | "phone" | "chat" | "api";

type IncidentStatus =
  | "new"
  | "assigned"
  | "open"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed"
  | "cancelled"
  | "escalated";

interface Incident {
  id: string;
  ticketNumber?: string | null;
  title: string;
  description: string;
  priority: string;
  impact: ImpactLevel;
  urgency: ImpactLevel;
  status: IncidentStatus | string;
  channel: IncidentChannel;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  slaResponseDue?: string | null;
  slaResolutionDue?: string | null;
  slaResponseMet?: boolean | null;
  slaResolutionMet?: boolean | null;
  createdAt: string;
  reporter?: { id: string; firstName: string; lastName: string; email: string } | null;
  assignee?: { id: string; firstName: string; lastName: string; email: string } | null;
  team?: { id: string; name: string } | null;
  tags?: string[];
  configurationItemIds?: string[];
  configurationItems?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    criticality: string;
    environment?: string | null;
  }>;
  workflows?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    currentStepId?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    workflowId?: string | null;
    dueAt?: string | null;
    createdAt: string;
  }>;
}

interface IncidentResponse {
  data: Incident[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

interface IncidentOptionsResponse {
  channels: string[];
  pendingReasons: string[];
  closureCodes: string[];
  problems?: Array<{ id: string; ticketNumber: string | null; title: string; status: string }>;
  knowledgeArticles?: Array<{ id: string; title: string }>;
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
  configurationItems: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    criticality: string;
    environment?: string | null;
  }>;
}

interface IncidentDuplicateCandidate {
  id: string;
  ticketNumber?: string | null;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  similarityScore: number;
}

interface IncidentDuplicatesResponse {
  target: {
    id: string;
    ticketNumber?: string | null;
    title: string;
    status: string;
  };
  duplicates: IncidentDuplicateCandidate[];
}

interface CreateIncidentPayload {
  title: string;
  description: string;
  priority: string;
  impact: ImpactLevel;
  urgency: ImpactLevel;
  channel: IncidentChannel;
  categoryId?: string;
  tags?: string[];
  configurationItemIds?: string[];
  problemId?: string;
  isMajorIncident?: boolean;
}

interface IncidentFormData {
  title: string;
  description: string;
  impact: ImpactLevel;
  urgency: ImpactLevel;
  priority: string;
  channel: IncidentChannel;
  categoryId: string;
  tagsInput: string;
  selectedConfigurationItemId: string;
  configurationItemIds: string[];
  problemId: string;
  isMajorIncident: boolean;
}

const INITIAL_FORM_DATA: IncidentFormData = {
  title: "",
  description: "",
  impact: "medium",
  urgency: "medium",
  priority: "medium",
  channel: "portal",
  categoryId: "",
  tagsInput: "",
  selectedConfigurationItemId: "",
  configurationItemIds: [],
  problemId: "",
  isMajorIncident: false,
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400" },
  assigned: { label: "Assigned", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  open: { label: "Open", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  in_progress: { label: "In Progress", bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  pending: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  resolved: { label: "Resolved", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  closed: { label: "Closed", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" },
  cancelled: { label: "Cancelled", bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400" },
  escalated: { label: "Escalated", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
};

const STATUS_TRANSITIONS: Array<{ value: string; label: string }> = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
  { value: "cancelled", label: "Cancelled" },
];

const CHANNEL_OPTIONS: Array<{ value: IncidentChannel; label: string }> = [
  { value: "portal", label: "Portal" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat", label: "Chat" },
  { value: "api", label: "API" },
];

async function fetchIncidentsWithFilters(
  token: string,
  filters: {
    status?: string;
    channel?: string;
    impact?: string;
    urgency?: string;
    categoryId?: string;
    slaState?: string;
    ticketNumber?: string;
    search?: string;
    priority?: string;
    isMajorIncident?: boolean;
  }
): Promise<IncidentResponse> {
  const searchParams = new URLSearchParams();
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.channel) searchParams.set("channel", filters.channel);
  if (filters.impact) searchParams.set("impact", filters.impact);
  if (filters.urgency) searchParams.set("urgency", filters.urgency);
  if (filters.categoryId) searchParams.set("categoryId", filters.categoryId);
  if (filters.slaState) searchParams.set("slaState", filters.slaState);
  if (filters.ticketNumber) searchParams.set("ticketNumber", filters.ticketNumber);
  if (filters.search) searchParams.set("search", filters.search);
  if (filters.priority) searchParams.set("priority", filters.priority);
  if (filters.isMajorIncident === true) searchParams.set("isMajorIncident", "true");

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/incidents${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

async function fetchIncidentOptions(token: string): Promise<IncidentOptionsResponse> {
  const res = await fetch(`${API_URL}/incidents/options`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch incident options");
  return res.json();
}

async function createIncident(token: string, data: CreateIncidentPayload) {
  const res = await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create incident");
  return res.json();
}

async function transitionIncident(
  token: string,
  id: string,
  data: {
    toStatus: string;
    reason?: string;
    pendingReason?: string;
    resolutionSummary?: string;
    closureCode?: string;
    comment?: string;
    onHoldUntil?: string;
    problemId?: string;
    knowledgeArticleId?: string;
  }
) {
  const res = await fetch(`${API_URL}/incidents/${id}/transition`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || "Failed to transition incident");
  }

  return res.json();
}

async function exportIncidentsCSV(token: string, status?: string) {
  const searchParams = new URLSearchParams();
  if (status) {
    searchParams.set("status", status);
  }

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/incidents/export/csv${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to export incidents");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidents_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

async function fetchCorrelationMap(token: string): Promise<CorrelationMap> {
  const res = await fetch(`${API_URL}/dashboard/correlation-map`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch correlation map");
  return res.json();
}

async function fetchIncidentDetail(token: string, id: string): Promise<Incident> {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch incident details");
  return res.json();
}

async function fetchIncidentDuplicates(
  token: string,
  id: string
): Promise<IncidentDuplicatesResponse> {
  const res = await fetch(`${API_URL}/incidents/${id}/duplicates?limit=6`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch potential duplicates");
  }

  return res.json();
}

async function mergeIncidents(
  token: string,
  payload: { targetIncidentId: string; sourceIncidentIds: string[]; reason?: string }
) {
  const res = await fetch(`${API_URL}/incidents/merge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to merge incidents");
  }

  return res.json();
}

function formatStatus(status: string) {
  return STATUS_META[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
  };
}

function formatTicketNumber(ticketNumber: string | null | undefined, incidentId: string) {
  if (ticketNumber && ticketNumber.trim().length > 0) {
    return ticketNumber;
  }
  return `INC-${incidentId.slice(0, 8).toUpperCase()}`;
}

function formatDateTime(date?: string | null) {
  if (!date) return "Not set";

  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IncidentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [impactFilter, setImpactFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [slaStateFilter, setSlaStateFilter] = useState("");
  const [ticketNumberFilter, setTicketNumberFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [majorIncidentFilter, setMajorIncidentFilter] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [transitionTargetIncident, setTransitionTargetIncident] = useState<Incident | null>(null);
  const [transitionForm, setTransitionForm] = useState({
    toStatus: "assigned",
    reason: "",
    pendingReason: "",
    resolutionSummary: "",
    closureCode: "",
    comment: "",
    onHoldUntil: "",
    problemId: "",
    knowledgeArticleId: "",
  });
  const [formData, setFormData] = useState<IncidentFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setDialogOpen(true);
      router.replace("/incidents", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const priority = searchParams.get("priority");
    const major = searchParams.get("isMajorIncident") === "true";
    const status = searchParams.get("status");
    if (priority) setPriorityFilter(priority);
    if (major) setMajorIncidentFilter(true);
    if (status) setStatusFilter(status);
  }, [searchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "incidents",
      statusFilter,
      channelFilter,
      impactFilter,
      urgencyFilter,
      categoryFilter,
      slaStateFilter,
      ticketNumberFilter,
      searchTerm,
      priorityFilter,
      majorIncidentFilter,
    ],
    queryFn: () =>
      fetchIncidentsWithFilters(token!, {
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        impact: impactFilter || undefined,
        urgency: urgencyFilter || undefined,
        categoryId: categoryFilter || undefined,
        slaState: slaStateFilter || undefined,
        ticketNumber: ticketNumberFilter || undefined,
        search: searchTerm || undefined,
        priority: priorityFilter || undefined,
        isMajorIncident: majorIncidentFilter || undefined,
      }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: incidentOptions } = useQuery({
    queryKey: ["incidents", "options"],
    queryFn: () => fetchIncidentOptions(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: correlationMap } = useQuery({
    queryKey: ["dashboard", "correlation-map"],
    queryFn: () => fetchCorrelationMap(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: selectedIncidentDetail, isLoading: selectedIncidentDetailLoading } = useQuery({
    queryKey: ["incident", selectedIncident?.id],
    queryFn: () => fetchIncidentDetail(token!, selectedIncident!.id),
    enabled: isAuthenticated && !!token && !!selectedIncident?.id,
    retry: false,
  });

  const { data: duplicateCandidates, isLoading: duplicatesLoading, refetch: refetchDuplicates } =
    useQuery({
      queryKey: ["incident-duplicates", selectedIncident?.id],
      queryFn: () => fetchIncidentDuplicates(token!, selectedIncident!.id),
      enabled: isAuthenticated && !!token && !!selectedIncident?.id,
      retry: false,
    });

  const createMutation = useMutation({
    mutationFn: () => {
      const tags = formData.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      return createIncident(token!, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        impact: formData.impact,
        urgency: formData.urgency,
        channel: formData.channel,
        categoryId: formData.categoryId || undefined,
        ...(tags.length > 0 ? { tags } : {}),
        ...(formData.configurationItemIds.length > 0
          ? { configurationItemIds: formData.configurationItemIds }
          : {}),
        ...(formData.problemId ? { problemId: formData.problemId } : {}),
        ...(formData.isMajorIncident ? { isMajorIncident: true } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setDialogOpen(false);
      setFormData(INITIAL_FORM_DATA);
      setError("");
      addToast({
        type: "success",
        title: "Incident created",
        description: "The incident has been created successfully.",
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create incident");
      addToast({ type: "error", title: "Failed to create incident" });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        toStatus: string;
        reason?: string;
        pendingReason?: string;
        resolutionSummary?: string;
        closureCode?: string;
        comment?: string;
        onHoldUntil?: string;
        problemId?: string;
        knowledgeArticleId?: string;
      };
    }) => transitionIncident(token!, id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident", variables.id] });
      addToast({ type: "success", title: "Incident transitioned" });
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: err instanceof Error ? err.message : "Failed to transition incident",
      });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({
      sourceIncidentId,
      targetIncidentId,
    }: {
      sourceIncidentId: string;
      targetIncidentId: string;
    }) =>
      mergeIncidents(token!, {
        targetIncidentId,
        sourceIncidentIds: [sourceIncidentId],
        reason: "Marked as duplicate from incident workspace",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident", variables.targetIncidentId] });
      queryClient.invalidateQueries({ queryKey: ["incident-duplicates", variables.targetIncidentId] });
      addToast({
        type: "success",
        title: "Duplicate merged",
        description: "Source incident was merged into the current incident.",
      });
      refetchDuplicates();
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: err instanceof Error ? err.message : "Failed to merge incident",
      });
    },
  });

  const handlePriorityChange = useCallback((priority: string) => {
    setFormData((current) => (current.priority === priority ? current : { ...current, priority }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required");
      return;
    }

    createMutation.mutate();
  };

  const openTransitionDialog = (incident: Incident, newStatus: string) => {
    setTransitionTargetIncident(incident);
    setTransitionForm({
      toStatus: newStatus,
      reason: "",
      pendingReason: "",
      resolutionSummary: "",
      closureCode: "",
      problemId: "",
      knowledgeArticleId: "",
      comment: "",
      onHoldUntil: "",
    });
    setTransitionDialogOpen(true);
  };

  const submitTransition = () => {
    if (!transitionTargetIncident) return;

    if (transitionForm.toStatus === "pending" && !transitionForm.pendingReason.trim()) {
      addToast({ type: "error", title: "Pending reason is required" });
      return;
    }
    if (transitionForm.toStatus === "resolved" && !transitionForm.resolutionSummary.trim()) {
      addToast({ type: "error", title: "Resolution summary is required" });
      return;
    }
    if (transitionForm.toStatus === "closed" && !transitionForm.closureCode.trim()) {
      addToast({ type: "error", title: "Closure code is required" });
      return;
    }
    if (transitionForm.toStatus === "cancelled" && !transitionForm.reason.trim()) {
      addToast({ type: "error", title: "Cancellation reason is required" });
      return;
    }

    transitionMutation.mutate(
      {
        id: transitionTargetIncident.id,
        data: {
          toStatus: transitionForm.toStatus,
          reason: transitionForm.reason || undefined,
          pendingReason: transitionForm.pendingReason || undefined,
          resolutionSummary: transitionForm.resolutionSummary || undefined,
          closureCode: transitionForm.closureCode || undefined,
          comment: transitionForm.comment || undefined,
          onHoldUntil: transitionForm.onHoldUntil || undefined,
          problemId: transitionForm.problemId || undefined,
          knowledgeArticleId: transitionForm.knowledgeArticleId || undefined,
        },
      },
      {
        onSuccess: () => {
          setTransitionDialogOpen(false);
          setTransitionTargetIncident(null);
        },
      }
    );
  };

  const incidents = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredIncidents = incidents;

  const incidentStats = useMemo(() => {
    const totals = {
      total: incidents.length,
      critical: incidents.filter((incident) => incident.priority === "critical").length,
      active: incidents.filter((incident) => ["new", "assigned", "open", "in_progress", "pending", "escalated"].includes(incident.status)).length,
      resolved: incidents.filter((incident) => incident.status === "resolved" || incident.status === "closed").length,
      breached: incidents.filter(
        (incident) => incident.slaResponseMet === false || incident.slaResolutionMet === false
      ).length,
    };

    return totals;
  }, [incidents]);

  const selectedIncidentRelatedRecords = selectedIncident
    ? [
      selectedIncident.assignee
        ? {
          type: "user",
          id: selectedIncident.assignee.id,
          systemRecordId: `user:${selectedIncident.assignee.id}`,
          relationship: "assigned_to",
        }
        : null,
      selectedIncident.reporter
        ? {
          type: "user",
          id: selectedIncident.reporter.id,
          systemRecordId: `user:${selectedIncident.reporter.id}`,
          relationship: "reported_by",
        }
        : null,
      selectedIncident.team
        ? {
          type: "team",
          id: selectedIncident.team.id,
          systemRecordId: `team:${selectedIncident.team.id}`,
          relationship: "owned_by_team",
        }
        : null,
    ].filter(Boolean) as Array<{ type: string; id: string; systemRecordId: string; relationship?: string }>
    : [];
  const selectedIncidentData = selectedIncidentDetail || selectedIncident;
  const openWorkflowTaskCount = (selectedIncidentData?.tasks || []).filter(
    (task) =>
      !!task.workflowId &&
      ["pending", "in_progress"].includes(task.status)
  ).length;

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <OperationsPageHeader
        title="Incidents"
        description="Track incident lifecycle with ITIL ticketing, priority matrix, and SLA visibility."
        actions={
          <>
            <Button
              variant="glass"
              onClick={async () => {
                try {
                  await exportIncidentsCSV(token!, statusFilter || undefined);
                  addToast({ title: "Export complete", description: "Incidents downloaded as CSV", type: "success" });
                } catch {
                  addToast({ title: "Export failed", description: "Could not export incidents", type: "error" });
                }
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="gradient" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Incident
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OperationsMetricCard label="Total Incidents" value={incidentStats.total} icon={AlertTriangle} tone="violet" />
        <OperationsMetricCard label="Critical Priority" value={incidentStats.critical} icon={Zap} tone="rose" valueClassName="text-rose-500" />
        <OperationsMetricCard label="Active Queue" value={incidentStats.active} icon={Clock} tone="amber" valueClassName="text-amber-500" />
        <OperationsMetricCard label="Resolved/Closed" value={incidentStats.resolved} icon={AlertTriangle} tone="emerald" valueClassName="text-emerald-500" />
        <OperationsMetricCard label="SLA Breaches" value={incidentStats.breached} icon={Filter} tone="cyan" valueClassName="text-cyan-500" />
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/30 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/30 md:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ticket, title, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <Input
          placeholder="Ticket number"
          value={ticketNumberFilter}
          onChange={(e) => setTicketNumberFilter(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "new", label: "New" },
            { value: "assigned", label: "Assigned" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "pending", label: "Pending" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
            { value: "escalated", label: "Escalated" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <Select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          options={[{ value: "", label: "All Channels" }, ...CHANNEL_OPTIONS]}
        />
        <Select
          value={slaStateFilter}
          onChange={(e) => setSlaStateFilter(e.target.value)}
          options={[
            { value: "", label: "All SLA States" },
            { value: "on_track", label: "On Track" },
            { value: "at_risk", label: "At Risk" },
            { value: "breached", label: "Breached" },
          ]}
        />
        <Select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value)}
          options={[
            { value: "", label: "All Impact" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <Select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          options={[
            { value: "", label: "All Urgency" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: "", label: "All Categories" },
            ...((incidentOptions?.categories || []).map((category) => ({
              value: category.id,
              label: category.name,
            }))),
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: "", label: "All Priorities" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={majorIncidentFilter}
            onChange={(e) => setMajorIncidentFilter(e.target.checked)}
            className="rounded border-input"
          />
          Major Incidents only
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
            setChannelFilter("");
            setImpactFilter("");
            setUrgencyFilter("");
            setCategoryFilter("");
            setSlaStateFilter("");
            setTicketNumberFilter("");
            setPriorityFilter("");
            setMajorIncidentFilter(false);
          }}
        >
          Clear
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusMatrix
          title="Incident Correlation Health"
          items={[
            {
              name: "Active Ratio",
              value:
                incidents.length > 0
                  ? Math.round((incidentStats.active / incidents.length) * 100)
                  : 0,
              target: 100,
              hint: "Incidents currently in working statuses",
            },
            {
              name: "Resolved Ratio",
              value:
                incidents.length > 0
                  ? Math.round((incidentStats.resolved / incidents.length) * 100)
                  : 0,
              target: 100,
              hint: "Incidents in resolved or closed state",
            },
            {
              name: "Cross-domain Linkage",
              value: correlationMap?.crossDomain.linkageCoveragePercent ?? 0,
              target: 100,
              hint: "Tasks linked to incidents/workflows/compliance entities",
            },
          ]}
        />

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Linked Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(correlationMap?.recentActivity || []).slice(0, 5).map((activity) => (
              <div key={activity.id} className="space-y-1 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="text-sm font-medium">{activity.title}</div>
                <SystemRecordBadge value={activity.systemRecordId} compact />
              </div>
            ))}
            {(!correlationMap?.recentActivity || correlationMap.recentActivity.length === 0) && (
              <div className="text-sm text-muted-foreground">No recent linked activity</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "500ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-violet-500" />
            </div>
            Incident Queue ({data?.pagination.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-muted/50 shimmer" />
              ))}
            </div>
          ) : filteredIncidents.length > 0 ? (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => {
                const statusStyle = formatStatus(incident.status);
                const ticket = formatTicketNumber(incident.ticketNumber, incident.id);
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className="group cursor-pointer rounded-xl border border-white/20 bg-white/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/50 hover:shadow-lg dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <TicketNumberBadge ticketNumber={ticket} compact />
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                          </span>
                          <ChannelBadge channel={incident.channel} />
                          {incident.tags?.includes("major") && (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0">
                              Major
                            </Badge>
                          )}
                        </div>
                        <h3 className="truncate text-base font-semibold">{incident.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{incident.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(incident.createdAt).toLocaleDateString()}
                          </span>
                          {incident.reporter ? (
                            <span className="inline-flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {incident.reporter.firstName} {incident.reporter.lastName}
                            </span>
                          ) : null}
                          <ImpactUrgencyBadge impact={incident.impact} urgency={incident.urgency} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={incident.priority} />
                          {incident.slaResponseDue ? <SLAIndicator dueAt={incident.slaResponseDue} type="response" compact /> : null}
                          {incident.slaResolutionDue ? (
                            <SLAIndicator dueAt={incident.slaResolutionDue} type="resolution" compact />
                          ) : null}
                        </div>

                        <div className="mt-3">
                          <SystemRecordBadge value={`incident:${incident.id}`} compact />
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <AlertTriangle className="h-8 w-8 text-violet-500" />
              </div>
              <p className="text-lg font-medium">No incidents found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search and filters.</p>
              <Button variant="gradient" className="mt-6" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Incident
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create New Incident" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Input
            label="Title"
            placeholder="Brief description of the incident"
            value={formData.title}
            onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
            required
          />

          <Textarea
            label="Description"
            placeholder="Detailed description of the incident"
            value={formData.description}
            onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
            required
          />

          <PriorityMatrixSelector
            impact={formData.impact}
            urgency={formData.urgency}
            onImpactChange={(impact) => setFormData((current) => ({ ...current, impact: impact as ImpactLevel }))}
            onUrgencyChange={(urgency) => setFormData((current) => ({ ...current, urgency: urgency as ImpactLevel }))}
            onPriorityChange={handlePriorityChange}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Channel"
              value={formData.channel}
              onChange={(e) => setFormData((current) => ({ ...current, channel: e.target.value as IncidentChannel }))}
              options={CHANNEL_OPTIONS}
            />
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData((current) => ({ ...current, categoryId: e.target.value }))}
              options={[
                { value: "", label: "Uncategorized" },
                ...((incidentOptions?.categories || []).map((category) => ({
                  value: category.id,
                  label: category.name,
                }))),
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tags"
              placeholder="security, production, api"
              value={formData.tagsInput}
              onChange={(e) => setFormData((current) => ({ ...current, tagsInput: e.target.value }))}
            />
            <Select
              label="Add Configuration Item"
              value={formData.selectedConfigurationItemId}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                setFormData((current) => {
                  if (current.configurationItemIds.includes(value)) {
                    return { ...current, selectedConfigurationItemId: "" };
                  }
                  return {
                    ...current,
                    selectedConfigurationItemId: "",
                    configurationItemIds: [...current.configurationItemIds, value],
                  };
                });
              }}
              options={[
                { value: "", label: "Select configuration item" },
                ...((incidentOptions?.configurationItems || []).map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.type})`,
                }))),
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Link to Problem (optional)"
              value={formData.problemId}
              onChange={(e) => setFormData((current) => ({ ...current, problemId: e.target.value }))}
              options={[
                { value: "", label: "No problem linked" },
                ...((incidentOptions?.problems || []).map((p) => ({
                  value: p.id,
                  label: `${p.ticketNumber || p.id.slice(0, 8)} · ${p.title}`,
                }))),
              ]}
            />
            <label className="flex items-center gap-2 text-sm pt-8">
              <input
                type="checkbox"
                checked={formData.isMajorIncident}
                onChange={(e) => setFormData((current) => ({ ...current, isMajorIncident: e.target.checked }))}
                className="rounded border-input"
              />
              Major Incident (high-impact event)
            </label>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <span className="text-xs text-muted-foreground">Linked Configuration Items</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {formData.configurationItemIds.length === 0 ? (
                <span className="text-xs text-muted-foreground">No configuration items selected.</span>
              ) : (
                formData.configurationItemIds.map((id) => {
                  const item = incidentOptions?.configurationItems?.find((ci) => ci.id === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-background px-2 py-1 text-xs"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          configurationItemIds: current.configurationItemIds.filter((ciId) => ciId !== id),
                        }))
                      }
                    >
                      {item?.name || id}
                      <span className="text-muted-foreground">x</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Incident"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Sheet
        open={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={
          selectedIncidentData
            ? `${formatTicketNumber(selectedIncidentData.ticketNumber, selectedIncidentData.id)} - ${selectedIncidentData.title}`
            : ""
        }
      >
        {selectedIncidentData ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={selectedIncidentData.priority} />
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${formatStatus(selectedIncidentData.status).bg} ${formatStatus(selectedIncidentData.status).text}`}
              >
                {formatStatus(selectedIncidentData.status).label}
              </span>
              <ChannelBadge channel={selectedIncidentData.channel} />
              {selectedIncidentData.tags?.includes("major") && (
                <Badge variant="destructive">Major Incident</Badge>
              )}
              <ImpactUrgencyBadge impact={selectedIncidentData.impact} urgency={selectedIncidentData.urgency} />
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-foreground">{selectedIncidentData.description}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">SLA Indicators</h4>
              <div className="space-y-3">
                {selectedIncidentData.slaResponseDue ? (
                  <div className="space-y-2">
                    <SLAIndicator dueAt={selectedIncidentData.slaResponseDue} type="response" />
                    {selectedIncidentData.slaResponseMet !== null && selectedIncidentData.slaResponseMet !== undefined ? (
                      <Badge variant={selectedIncidentData.slaResponseMet ? "success" : "error"}>
                        {selectedIncidentData.slaResponseMet ? "Response SLA met" : "Response SLA breached"}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Response SLA not assigned
                  </div>
                )}

                {selectedIncidentData.slaResolutionDue ? (
                  <div className="space-y-2">
                    <SLAIndicator dueAt={selectedIncidentData.slaResolutionDue} type="resolution" />
                    {selectedIncidentData.slaResolutionMet !== null && selectedIncidentData.slaResolutionMet !== undefined ? (
                      <Badge variant={selectedIncidentData.slaResolutionMet ? "success" : "error"}>
                        {selectedIncidentData.slaResolutionMet ? "Resolution SLA met" : "Resolution SLA breached"}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Resolution SLA not assigned
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <p className="mt-1 font-medium">{formatDateTime(selectedIncidentData.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">Ticket</span>
                  <p className="mt-1 font-mono text-sm font-medium">
                    {formatTicketNumber(selectedIncidentData.ticketNumber, selectedIncidentData.id)}
                  </p>
                </div>
                {selectedIncidentData.reporter ? (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Reporter</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-xs text-white">
                          {selectedIncidentData.reporter.firstName[0]}
                          {selectedIncidentData.reporter.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {selectedIncidentData.reporter.firstName} {selectedIncidentData.reporter.lastName}
                      </span>
                    </div>
                  </div>
                ) : null}
                {selectedIncidentData.team ? (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Team</span>
                    <p className="mt-1 font-medium">{selectedIncidentData.team.name}</p>
                  </div>
                ) : null}
                {selectedIncidentData.category ? (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p className="mt-1 font-medium">{selectedIncidentData.category.name}</p>
                  </div>
                ) : null}
                {selectedIncidentData.tags && selectedIncidentData.tags.length > 0 ? (
                  <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Tags</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedIncidentData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedIncidentData.configurationItems && selectedIncidentData.configurationItems.length > 0 ? (
                  <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Configuration Items</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedIncidentData.configurationItems.map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Linked Workflow and Tasks</h4>
              {selectedIncidentDetailLoading ? (
                <div className="h-20 rounded-xl bg-muted/50 shimmer" />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">Workflows</div>
                    <div className="mt-1 text-lg font-semibold">
                      {selectedIncidentData.workflows?.length || 0}
                    </div>
                    <div className="mt-2 space-y-1">
                      {(selectedIncidentData.workflows || []).slice(0, 3).map((workflow) => (
                        <button
                          key={workflow.id}
                          type="button"
                          className="block w-full truncate rounded-md bg-background/60 px-2 py-1 text-left text-xs hover:bg-background"
                          onClick={() => router.push(`/workflows/${workflow.id}`)}
                        >
                          {workflow.name} · {workflow.status}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => router.push(`/workflows?incidentId=${selectedIncidentData.id}`)}
                    >
                      View All Workflows
                    </Button>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">Tasks</div>
                    <div className="mt-1 text-lg font-semibold">{selectedIncidentData.tasks?.length || 0}</div>
                    <div className="mt-2 space-y-1">
                      {(selectedIncidentData.tasks || []).slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className="block w-full truncate rounded-md bg-background/60 px-2 py-1 text-left text-xs hover:bg-background"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          {task.title} · {task.status}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => router.push(`/tasks?incidentId=${selectedIncidentData.id}`)}
                    >
                      View All Tasks
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Unified Record</h4>
              <SystemRecordBadge value={`incident:${selectedIncidentData.id}`} />
              <RelatedRecordList records={selectedIncidentRelatedRecords} />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Potential Duplicates</h4>
                <Button variant="outline" size="sm" onClick={() => refetchDuplicates()} disabled={duplicatesLoading}>
                  Refresh
                </Button>
              </div>
              {duplicatesLoading ? (
                <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Checking duplicates...
                </div>
              ) : duplicateCandidates?.duplicates && duplicateCandidates.duplicates.length > 0 ? (
                <div className="space-y-2">
                  {duplicateCandidates.duplicates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="rounded-xl border border-border/60 bg-muted/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {formatTicketNumber(candidate.ticketNumber, candidate.id)} · score{" "}
                            {(candidate.similarityScore * 100).toFixed(0)}%
                          </div>
                          <div className="truncate text-sm font-medium">{candidate.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatStatus(candidate.status).label} · {candidate.priority}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/incidents/${candidate.id}`)}
                          >
                            Open
                          </Button>
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() =>
                              mergeMutation.mutate({
                                sourceIncidentId: candidate.id,
                                targetIncidentId: selectedIncidentData.id,
                              })
                            }
                            disabled={mergeMutation.isPending}
                          >
                            Merge
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                  No strong duplicate candidates found.
                </div>
              )}
            </div>

            <Separator />

            {openWorkflowTaskCount > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                Resolve is blocked until correlated workflow tasks are completed. Open workflow tasks: {openWorkflowTaskCount}.
              </div>
            ) : null}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Status Transitions</h4>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_TRANSITIONS.map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedIncident.status === status.value ? "gradient" : "glass"}
                    size="sm"
                    onClick={() => openTransitionDialog(selectedIncidentData, status.value)}
                    disabled={
                      transitionMutation.isPending ||
                      selectedIncidentData.status === status.value
                    }
                    className="text-xs"
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/incidents/${selectedIncidentData.id}`)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Details
            </Button>
          </div>
        ) : null}
      </Sheet>

      <Dialog
        open={transitionDialogOpen && !!transitionTargetIncident}
        onClose={() => setTransitionDialogOpen(false)}
        title={`Transition ${transitionTargetIncident ? formatTicketNumber(transitionTargetIncident.ticketNumber, transitionTargetIncident.id) : "Incident"}`}
      >
        <div className="space-y-4">
          <Select
            label="Target Status"
            value={transitionForm.toStatus}
            onChange={(event) => setTransitionForm((current) => ({ ...current, toStatus: event.target.value }))}
            options={STATUS_TRANSITIONS}
          />

          {transitionForm.toStatus === "pending" ? (
            <>
              <Input
                label="Pending Reason"
                value={transitionForm.pendingReason}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, pendingReason: event.target.value }))
                }
                placeholder="Waiting for vendor/customer/change window"
              />
              <Input
                label="On Hold Until"
                type="datetime-local"
                value={transitionForm.onHoldUntil}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, onHoldUntil: event.target.value }))
                }
              />
            </>
          ) : null}

          {transitionForm.toStatus === "resolved" ? (
            <>
              <Textarea
                label="Resolution Summary"
                value={transitionForm.resolutionSummary}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, resolutionSummary: event.target.value }))
                }
                placeholder="Describe what fixed the incident"
              />
              <Select
                label="Link to Problem (optional)"
                value={transitionForm.problemId}
                onChange={(e) => setTransitionForm((current) => ({ ...current, problemId: e.target.value }))}
                options={[
                  { value: "", label: "No problem linked" },
                  ...((incidentOptions?.problems || []).map((p) => ({
                    value: p.id,
                    label: `${p.ticketNumber || p.id.slice(0, 8)} · ${p.title}`,
                  }))),
                ]}
              />
              <Select
                label="Link to Knowledge Article (optional)"
                value={transitionForm.knowledgeArticleId}
                onChange={(e) => setTransitionForm((current) => ({ ...current, knowledgeArticleId: e.target.value }))}
                options={[
                  { value: "", label: "No article linked" },
                  ...((incidentOptions?.knowledgeArticles || []).map((ka) => ({
                    value: ka.id,
                    label: ka.title,
                  }))),
                ]}
              />
            </>
          ) : null}

          {transitionForm.toStatus === "closed" ? (
            <>
              <Select
                label="Closure Code"
                value={transitionForm.closureCode}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, closureCode: event.target.value }))
                }
                options={[
                  { value: "", label: "Select closure code" },
                  ...((incidentOptions?.closureCodes || []).map((code) => ({
                    value: code,
                    label: code.replace(/_/g, " "),
                  }))),
                ]}
              />
              <Select
                label="Link to Problem (optional)"
                value={transitionForm.problemId}
                onChange={(e) => setTransitionForm((current) => ({ ...current, problemId: e.target.value }))}
                options={[
                  { value: "", label: "No problem linked" },
                  ...((incidentOptions?.problems || []).map((p) => ({
                    value: p.id,
                    label: `${p.ticketNumber || p.id.slice(0, 8)} · ${p.title}`,
                  }))),
                ]}
              />
              <Select
                label="Link to Knowledge Article (optional)"
                value={transitionForm.knowledgeArticleId}
                onChange={(e) => setTransitionForm((current) => ({ ...current, knowledgeArticleId: e.target.value }))}
                options={[
                  { value: "", label: "No article linked" },
                  ...((incidentOptions?.knowledgeArticles || []).map((ka) => ({
                    value: ka.id,
                    label: ka.title,
                  }))),
                ]}
              />
            </>
          ) : null}

          {transitionForm.toStatus === "cancelled" ? (
            <Textarea
              label="Cancellation Reason"
              value={transitionForm.reason}
              onChange={(event) =>
                setTransitionForm((current) => ({ ...current, reason: event.target.value }))
              }
              placeholder="Why this incident is being cancelled"
            />
          ) : null}

          <Textarea
            label="Transition Comment (optional)"
            value={transitionForm.comment}
            onChange={(event) =>
              setTransitionForm((current) => ({ ...current, comment: event.target.value }))
            }
            placeholder="Context for audit trail"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTransitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={submitTransition}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Applying..." : "Apply Transition"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
