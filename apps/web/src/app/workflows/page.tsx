"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { 
  GitBranch, Plus, Filter, Search, Calendar, ChevronRight, RefreshCw, 
  CheckCircle2, Circle, Loader2, XCircle, AlertCircle, Settings, ExternalLink, Trash2
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
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";

interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: "auto" | "manual" | "approval";
  assignee?: string;
  config?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status?: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  completedAt?: string;
  completedBy?: string;
  nextSteps?: string[];
}

interface Workflow {
  id: string;
  name: string;
  type: string;
  status: string;
  currentStepId?: string;
  steps: WorkflowStep[];
  context: Record<string, any>;
  incidentId?: string;
  systemRecordId?: string;
  relatedRecords?: Array<{
    type: string;
    id: string;
    systemRecordId: string;
    relationship?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface WorkflowResponse {
  data: Workflow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  caseType: string;
  stepCount: number;
  steps: WorkflowStep[];
}

interface WorkflowExceptionAnalytics {
  totalWorkflows: number;
  failedWorkflows: number;
  cancelledWorkflows: number;
  failedSteps: number;
  skippedSteps: number;
  rollbackSignals: number;
  retrySignals: number;
  stepFailureRatePercent: number;
  retrySignalRatePercent: number;
  topFailedSteps: Array<{ stepName: string; count: number }>;
  recentExceptions: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
    failedSteps: string[];
    reason?: string;
  }>;
  windowStart: string;
}

async function fetchWorkflows(
  token: string,
  filters?: {
    incidentId?: string;
    status?: string;
    type?: string;
    entityId?: string;
    systemRecordId?: string;
    search?: string;
  }
): Promise<WorkflowResponse> {
  const searchParams = new URLSearchParams();
  if (filters?.incidentId) {
    searchParams.set("incidentId", filters.incidentId);
  }
  if (filters?.status) {
    searchParams.set("status", filters.status);
  }
  if (filters?.type) {
    searchParams.set("type", filters.type);
  }
  if (filters?.entityId) {
    searchParams.set("entityId", filters.entityId);
  }
  if (filters?.systemRecordId) {
    searchParams.set("systemRecordId", filters.systemRecordId);
  }
  if (filters?.search) {
    searchParams.set("search", filters.search);
  }

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/workflows${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

async function fetchWorkflowTemplates(token: string): Promise<WorkflowTemplate[]> {
  const res = await fetch(`${API_URL}/workflows/templates?caseType=incident`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch workflow templates");
  return res.json();
}

async function fetchWorkflowExceptionAnalytics(token: string): Promise<WorkflowExceptionAnalytics> {
  const res = await fetch(`${API_URL}/workflows/exception-analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch workflow exception analytics");
  return res.json();
}

async function createWorkflow(token: string, data: {
  name: string;
  type: string;
  incidentId?: string;
  steps: WorkflowStep[];
  context?: Record<string, unknown>;
}) {
  // Filter out empty incidentId to avoid UUID validation error
  const payload: any = { ...data };
  if (!payload.incidentId || payload.incidentId.trim() === "") {
    delete payload.incidentId;
  }
  
  const res = await fetch(`${API_URL}/workflows`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create workflow");
  }
  return res.json();
}

async function createWorkflowFromTemplate(token: string, data: {
  templateId: string;
  name?: string;
  incidentId?: string;
  autoCreateTasks?: boolean;
}) {
  const payload: {
    templateId: string;
    autoCreateTasks: boolean;
    name?: string;
    incidentId?: string;
  } = {
    templateId: data.templateId,
    autoCreateTasks: data.autoCreateTasks ?? true,
  };
  if (data.name?.trim()) payload.name = data.name.trim();
  if (data.incidentId?.trim()) payload.incidentId = data.incidentId.trim();

  const res = await fetch(`${API_URL}/workflows/from-template`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create workflow from template");
  }
  return res.json();
}

async function advanceWorkflow(
  token: string,
  id: string,
  data: { action: string; comment?: string; nextStepId?: string; data?: Record<string, unknown> }
) {
  const res = await fetch(`${API_URL}/workflows/${id}/advance`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to advance workflow");
  return res.json();
}

async function cancelWorkflow(token: string, id: string, reason: string) {
  const res = await fetch(`${API_URL}/workflows/${id}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to cancel workflow");
  return res.json();
}

async function rollbackWorkflow(token: string, id: string, targetStepId: string, reason?: string) {
  const res = await fetch(`${API_URL}/workflows/${id}/rollback`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetStepId, reason }),
  });
  if (!res.ok) throw new Error("Failed to rollback workflow");
  return res.json();
}

async function deleteWorkflow(token: string, id: string) {
  const res = await fetch(`${API_URL}/workflows/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete workflow");
}

const statusConfig = {
  pending: { icon: Circle, gradient: "from-slate-400 to-gray-400", bg: "bg-slate-500/10", color: "text-slate-600", label: "Pending" },
  in_progress: { icon: Loader2, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10", color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", color: "text-emerald-600", label: "Completed" },
  failed: { icon: XCircle, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", color: "text-rose-600", label: "Failed" },
  cancelled: { icon: XCircle, gradient: "from-gray-400 to-zinc-400", bg: "bg-gray-500/10", color: "text-gray-500", label: "Cancelled" },
} as const;

const typeConfig = {
  incident_escalation: { label: "Incident Escalation", color: "text-rose-500" },
  approval: { label: "Approval", color: "text-amber-500" },
  change_request: { label: "Change Request", color: "text-violet-500" },
  onboarding: { label: "Onboarding", color: "text-emerald-500" },
  offboarding: { label: "Offboarding", color: "text-orange-500" },
  review: { label: "Review", color: "text-blue-500" },
} as const;

const stepStatusConfig = {
  pending: { icon: Circle, color: "text-slate-400", bg: "bg-slate-400/20", animate: false },
  in_progress: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/20", animate: true },
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/20", animate: false },
  failed: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/20", animate: false },
  skipped: { icon: ChevronRight, color: "text-gray-400", bg: "bg-gray-400/20", animate: false },
} as const;

export default function WorkflowsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedIncidentId = (searchParams.get("incidentId") || "").trim();
  const hasIncidentScope = scopedIncidentId.length > 0;
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [systemRecordFilter, setSystemRecordFilter] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    action: "approve",
    comment: "",
    nextStepId: "",
    data: "{}",
  });
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackTargetStepId, setRollbackTargetStepId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [createMode, setCreateMode] = useState<"manual" | "template">("manual");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    type: "approval",
    incidentId: scopedIncidentId,
    steps: [{ id: "step-1", name: "", type: "manual" }] as WorkflowStep[],
  });
  const [workflowContextJson, setWorkflowContextJson] = useState("{}");
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData((current) => ({ ...current, incidentId: scopedIncidentId }));
  }, [scopedIncidentId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "workflows",
      scopedIncidentId,
      statusFilter,
      typeFilter,
      entityIdFilter,
      systemRecordFilter,
      searchTerm,
    ],
    queryFn: () =>
      fetchWorkflows(token!, {
        incidentId: scopedIncidentId || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        entityId: entityIdFilter || undefined,
        systemRecordId: systemRecordFilter || undefined,
        search: searchTerm || undefined,
      }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["workflows", "templates"],
    queryFn: () => fetchWorkflowTemplates(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: exceptionAnalytics } = useQuery({
    queryKey: ["workflows", "exception-analytics"],
    queryFn: () => fetchWorkflowExceptionAnalytics(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (createMode === "template") {
        return createWorkflowFromTemplate(token!, {
          templateId: selectedTemplateId,
          name: formData.name,
          incidentId: formData.incidentId,
          autoCreateTasks,
        });
      }

      let parsedContext: Record<string, unknown> | undefined;
      if (workflowContextJson.trim()) {
        parsedContext = JSON.parse(workflowContextJson) as Record<string, unknown>;
      }

      return createWorkflow(token!, {
        ...formData,
        context: parsedContext,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setDialogOpen(false);
      setWizardStep(1);
      setCreateMode("manual");
      setSelectedTemplateId("");
      setAutoCreateTasks(true);
      setFormData({
        name: "",
        type: "approval",
        incidentId: scopedIncidentId,
        steps: [{ id: "step-1", name: "", type: "manual" }],
      });
      setWorkflowContextJson("{}");
      setError("");
      addToast({ type: "success", title: "Workflow created", description: "The workflow has been created successfully." });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
      addToast({ type: "error", title: "Failed to create workflow" });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: ({
      id,
      action,
      comment,
      nextStepId,
      data,
    }: {
      id: string;
      action: string;
      comment?: string;
      nextStepId?: string;
      data?: Record<string, unknown>;
    }) =>
      advanceWorkflow(token!, id, { action, comment, nextStepId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setActionDialogOpen(false);
      setActionForm({
        action: "approve",
        comment: "",
        nextStepId: "",
        data: "{}",
      });
      addToast({ type: "success", title: "Workflow advanced" });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to advance workflow" });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ id, targetStepId, reason }: { id: string; targetStepId: string; reason?: string }) =>
      rollbackWorkflow(token!, id, targetStepId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setRollbackDialogOpen(false);
      setRollbackTargetStepId("");
      setRollbackReason("");
      addToast({ type: "success", title: "Workflow rolled back" });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to rollback workflow" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelWorkflow(token!, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedWorkflow(null);
      addToast({ type: "success", title: "Workflow cancelled" });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to cancel workflow" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkflow(token!, selectedWorkflow!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setDeleteDialogOpen(false);
      setSelectedWorkflow(null);
      addToast({ type: "success", title: "Workflow deleted" });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to delete workflow" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createMode === "template") {
      if (!selectedTemplateId) {
        setError("Template selection is required");
        return;
      }
      createMutation.mutate();
      return;
    }

    if (!formData.name.trim()) {
      setError("Workflow name is required");
      return;
    }
    if (formData.steps.some(s => !s.name.trim())) {
      setError("All steps must have a name");
      return;
    }
    if (workflowContextJson.trim()) {
      try {
        JSON.parse(workflowContextJson);
      } catch {
        setError("Workflow context must be valid JSON");
        return;
      }
    }
    createMutation.mutate();
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: `step-${formData.steps.length + 1}`, name: "", type: "manual" }],
    });
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData({
        ...formData,
        steps: formData.steps.filter((_, i) => i !== index),
      });
    }
  };

  const submitWorkflowAction = () => {
    if (!selectedWorkflow) return;

    let parsedData: Record<string, unknown> | undefined;
    if (actionForm.data.trim()) {
      try {
        parsedData = JSON.parse(actionForm.data) as Record<string, unknown>;
      } catch {
        addToast({ type: "error", title: "Action data must be valid JSON" });
        return;
      }
    }

    advanceMutation.mutate({
      id: selectedWorkflow.id,
      action: actionForm.action,
      comment: actionForm.comment || undefined,
      nextStepId: actionForm.nextStepId || undefined,
      data: parsedData,
    });
  };

  if (!isAuthenticated) return null;

  const workflows = data?.data || [];
  const filteredWorkflows = workflows;
  const activeFilterCount = [statusFilter, typeFilter, entityIdFilter, systemRecordFilter].filter(Boolean).length;
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const analytics = exceptionAnalytics;

  const getProgress = (workflow: Workflow) => {
    const total = workflow.steps.length;
    const completed = workflow.steps.filter(s => s.status === "completed").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track automated and manual workflows
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              setCreateMode("manual");
              setWizardStep(1);
              setSelectedTemplateId("");
              setWorkflowContextJson("{}");
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card variant="glass" className="group overflow-hidden animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold mt-1">{workflows.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-1 text-blue-500">{workflows.filter(w => w.status === 'in_progress').length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-1 text-emerald-500">{workflows.filter(w => w.status === 'completed').length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold mt-1 text-rose-500">{workflows.filter(w => w.status === 'failed').length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Workflow Exception Analytics (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Failure Rate</p>
                <p className="text-xl font-semibold text-rose-500">
                  {analytics?.stepFailureRatePercent ?? 0}%
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Retry Signal Rate</p>
                <p className="text-xl font-semibold text-amber-500">
                  {analytics?.retrySignalRatePercent ?? 0}%
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Rollbacks</p>
                <p className="text-xl font-semibold">{analytics?.rollbackSignals ?? 0}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Failed Workflows</p>
                <p className="text-xl font-semibold text-rose-500">
                  {analytics?.failedWorkflows ?? 0}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Top Failed Steps</p>
              <div className="flex flex-wrap gap-2">
                {(analytics?.topFailedSteps || []).slice(0, 5).map((step) => (
                  <Badge key={step.stepName} variant="outline">
                    {step.stepName} ({step.count})
                  </Badge>
                ))}
                {!analytics?.topFailedSteps?.length && (
                  <span className="text-sm text-muted-foreground">No failed-step data in the last 30 days</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Recent Exceptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analytics?.recentExceptions || []).map((exception) => (
              <button
                key={exception.id}
                type="button"
                onClick={() => router.push(`/workflows/${exception.id}`)}
                className="w-full rounded-xl border border-white/20 bg-white/20 p-3 text-left transition-colors hover:bg-white/35 dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
              >
                <p className="text-sm font-medium">{exception.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {exception.status.replace("_", " ")} · {new Date(exception.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
            {!analytics?.recentExceptions?.length && (
              <p className="text-sm text-muted-foreground">No failed or cancelled workflows recently.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasIncidentScope && (
        <Card variant="glass" className="animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Incident-linked workflow view</p>
                <p className="text-xs text-muted-foreground">
                  Showing workflows for incident <code>{scopedIncidentId}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/incidents/${scopedIncidentId}`)}
                >
                  View Incident
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")}>
                  Clear Scope
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        <Button variant="glass" onClick={() => setFilterDialogOpen(true)}>
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      {/* Workflows List */}
      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <GitBranch className="h-5 w-5 text-violet-500" />
            </div>
            All Workflows ({filteredWorkflows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/50 rounded-xl shimmer" />
              ))}
            </div>
          ) : filteredWorkflows.length > 0 ? (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow, index) => {
                const statusStyle = statusConfig[workflow.status as keyof typeof statusConfig] ?? statusConfig["pending"];
                const typeStyle = typeConfig[workflow.type as keyof typeof typeConfig] ?? { label: workflow.type, color: "text-gray-500" };
                const progress = getProgress(workflow);
                const currentStep = workflow.steps.find(s => s.id === workflow.currentStepId);

                return (
                  <div
                    key={workflow.id}
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="group p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                            {statusStyle.label}
                          </span>
                          <span className={`text-xs font-medium ${typeStyle.color}`}>
                            {typeStyle.label}
                          </span>
                        </div>
                        {currentStep && (
                          <p className="text-sm text-muted-foreground">
                            Current: <span className="font-medium text-foreground">{currentStep.name}</span>
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-3">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${statusStyle.gradient} rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-1">
                      {workflow.steps.map((step, i) => {
                        const stepStyle = stepStatusConfig[step.status as keyof typeof stepStatusConfig] ?? stepStatusConfig["pending"];
                        const StepIcon = stepStyle.icon;
                        return (
                          <div key={step.id} className="flex items-center">
                            <div className={`h-8 w-8 rounded-full ${stepStyle.bg} flex items-center justify-center`}>
                              <StepIcon className={`h-4 w-4 ${stepStyle.color} ${stepStyle.animate ? 'animate-spin' : ''}`} />
                            </div>
                            {i < workflow.steps.length - 1 && (
                              <div className="w-6 h-0.5 bg-muted" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-5 text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Created {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Settings className="h-3.5 w-3.5" />
                        {workflow.steps.length} steps
                      </span>
                      {workflow.incidentId && (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/incidents/${workflow.incidentId}`);
                          }}
                        >
                          Incident
                        </button>
                      )}
                    </div>
                    {workflow.systemRecordId && (
                      <div className="mt-3">
                        <SystemRecordBadge value={workflow.systemRecordId} compact />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="h-8 w-8 text-violet-500" />
              </div>
              <p className="text-lg font-medium">No workflows found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first workflow to get started</p>
              <Button
                variant="gradient"
                className="mt-6"
                onClick={() => {
                  setCreateMode("manual");
                  setWizardStep(1);
                  setSelectedTemplateId("");
                  setWorkflowContextJson("{}");
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setWizardStep(1);
          setError("");
        }}
        title="Workflow Creation Wizard"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
            <Button
              type="button"
              variant={createMode === "manual" ? "gradient" : "ghost"}
              onClick={() => setCreateMode("manual")}
            >
              Manual Workflow
            </Button>
            <Button
              type="button"
              variant={createMode === "template" ? "gradient" : "ghost"}
              onClick={() => setCreateMode("template")}
            >
              From Template
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800/30">
            <span>Step {wizardStep} of 2</span>
            <span>{wizardStep === 1 ? "Scope & Mode" : "Configuration"}</span>
          </div>

          {wizardStep === 1 ? (
            <div className="space-y-4">
              <Input
                label="Workflow Name"
                placeholder="e.g., Incident Escalation Process"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={createMode === "manual"}
              />
              {createMode === "manual" && (
                <Select
                  label="Workflow Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={[
                    { value: "approval", label: "Approval" },
                    { value: "incident_escalation", label: "Incident Escalation" },
                    { value: "change_request", label: "Change Request" },
                    { value: "onboarding", label: "Onboarding" },
                    { value: "offboarding", label: "Offboarding" },
                    { value: "review", label: "Review" },
                  ]}
                />
              )}
              <Input
                label="Incident ID (Optional)"
                placeholder="Link to an existing incident"
                value={formData.incidentId}
                onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
              />
            </div>
          ) : (
            <>
              {createMode === "manual" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Steps</label>
                    <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                      <Plus className="h-4 w-4" />
                      Add Step
                    </Button>
                  </div>
                  {formData.steps.map((step, index) => (
                    <div key={step.id} className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 border border-white/10">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Step name"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                          required
                        />
                        <Select
                          value={step.type}
                          onChange={(e) => updateStep(index, "type", e.target.value)}
                          options={[
                            { value: "manual", label: "Manual" },
                            { value: "approval", label: "Approval" },
                            { value: "auto", label: "Automatic" },
                          ]}
                        />
                        <Input
                          placeholder="Step description (optional)"
                          value={step.description || ""}
                          onChange={(e) => updateStep(index, "description", e.target.value)}
                        />
                        <Input
                          placeholder="Assignee (user ID or role)"
                          value={step.assignee || ""}
                          onChange={(e) => updateStep(index, "assignee", e.target.value)}
                        />
                        <Input
                          placeholder="Next steps (comma separated step IDs)"
                          value={(step.nextSteps || []).join(",")}
                          onChange={(e) =>
                            updateStep(
                              index,
                              "nextSteps",
                              e.target.value
                                .split(",")
                                .map((value) => value.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                      </div>
                      {formData.steps.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <XCircle className="h-4 w-4 text-rose-500" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Textarea
                    label="Workflow Context JSON"
                    value={workflowContextJson}
                    onChange={(e) => setWorkflowContextJson(e.target.value)}
                    placeholder='{"ticket": "INC-1234", "env": "prod"}'
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Select
                    label="Template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    options={[
                      { value: "", label: "Select template" },
                      ...templates.map((template) => ({
                        value: template.id,
                        label: `${template.name} (${template.stepCount} steps)`,
                      })),
                    ]}
                  />
                  <Select
                    label="Auto-create Tasks"
                    value={autoCreateTasks ? "yes" : "no"}
                    onChange={(e) => setAutoCreateTasks(e.target.value === "yes")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                  {selectedTemplate ? (
                    <div className="rounded-lg border border-white/20 bg-white/20 p-3 dark:border-white/10 dark:bg-slate-800/30">
                      <p className="text-sm font-medium">{selectedTemplate.name}</p>
                      {selectedTemplate.description ? (
                        <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
                      ) : null}
                      <div className="mt-3 space-y-2">
                        {selectedTemplate.steps.map((step, index) => (
                          <div key={step.id} className="text-xs text-muted-foreground">
                            {index + 1}. {step.name} ({step.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {wizardStep === 2 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setWizardStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Workflow"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="gradient"
                onClick={() => setWizardStep(2)}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </Dialog>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} title="Workflow Filters">
        <div className="space-y-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <Select
            label="Type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={[
              { value: "", label: "All types" },
              { value: "incident_escalation", label: "Incident Escalation" },
              { value: "approval", label: "Approval" },
              { value: "change_request", label: "Change Request" },
              { value: "onboarding", label: "Onboarding" },
              { value: "offboarding", label: "Offboarding" },
              { value: "review", label: "Review" },
            ]}
          />
          <Input
            label="Entity ID"
            value={entityIdFilter}
            onChange={(event) => setEntityIdFilter(event.target.value)}
            placeholder="Filter by target entity ID"
          />
          <Input
            label="System Record ID"
            value={systemRecordFilter}
            onChange={(event) => setSystemRecordFilter(event.target.value)}
            placeholder="workflow:<id> or incident:<id>"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setEntityIdFilter("");
                setSystemRecordFilter("");
              }}
            >
              Clear
            </Button>
            <Button variant="gradient" onClick={() => setFilterDialogOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Workflow Detail Sheet */}
      <Sheet
        open={!!selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        title={selectedWorkflow?.name}
      >
        {selectedWorkflow && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${(statusConfig as any)[selectedWorkflow.status]?.bg || 'bg-gray-500/10'} ${(statusConfig as any)[selectedWorkflow.status]?.color || 'text-gray-600'}`}>
                {(statusConfig as any)[selectedWorkflow.status]?.label || selectedWorkflow.status}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600`}>
                {(typeConfig as any)[selectedWorkflow.type]?.label || selectedWorkflow.type}
              </span>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Workflow Timeline</h4>
              <div className="space-y-3">
                {selectedWorkflow.steps.map((step, index) => {
                  const stepStyle = stepStatusConfig[step.status as keyof typeof stepStatusConfig] ?? stepStatusConfig["pending"];
                  const StepIcon = stepStyle.icon;
                  const isCurrent = step.id === selectedWorkflow.currentStepId;

                  return (
                    <div key={step.id} className={`relative flex gap-4 ${isCurrent ? 'bg-blue-500/5 -mx-3 px-3 py-2 rounded-xl' : ''}`}>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <div className="absolute left-4 top-10 w-0.5 h-6 bg-muted" />
                      )}
                      <div className={`h-8 w-8 rounded-full ${stepStyle.bg} flex items-center justify-center flex-shrink-0`}>
                        <StepIcon className={`h-4 w-4 ${stepStyle.color} ${stepStyle.animate ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isCurrent ? 'text-blue-600' : ''}`}>{step.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${step.type === 'approval' ? 'bg-amber-500/10 text-amber-600' : step.type === 'auto' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'}`}>
                            {step.type}
                          </span>
                        </div>
                        {step.assignee ? (
                          <p className="text-xs text-muted-foreground mt-1">Assignee: {step.assignee}</p>
                        ) : null}
                        {step.description ? (
                          <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                        ) : null}
                        {step.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {new Date(step.completedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Linked Records</h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedWorkflow.incidentId && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/incidents/${selectedWorkflow.incidentId}`)}
                  >
                    View Linked Incident
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push(`/tasks?workflowId=${selectedWorkflow.id}`)}
                >
                  View Linked Tasks
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Unified Record</h4>
              {selectedWorkflow.systemRecordId && (
                <SystemRecordBadge value={selectedWorkflow.systemRecordId} />
              )}
              <RelatedRecordList records={selectedWorkflow.relatedRecords || []} />
            </div>

            <Separator />

            {/* Actions */}
            {selectedWorkflow.status !== 'completed' && selectedWorkflow.status !== 'cancelled' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => {
                    setActionForm({
                      action: "approve",
                      comment: "",
                      nextStepId: "",
                      data: "{}",
                    });
                    setActionDialogOpen(true);
                  }}
                  disabled={advanceMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Open Action Modal
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setRollbackTargetStepId(selectedWorkflow.steps[0]?.id || "");
                    setRollbackReason("");
                    setRollbackDialogOpen(true);
                  }}
                  disabled={rollbackMutation.isPending}
                >
                  <ChevronRight className="h-4 w-4" />
                  Rollback Workflow
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-rose-500 hover:text-rose-600"
                  onClick={() => {
                    setCancelDialogOpen(true);
                  }}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Workflow
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full text-rose-600 hover:text-rose-700"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Workflow
            </Button>

            <div className="text-xs text-muted-foreground">
              Created {new Date(selectedWorkflow.createdAt).toLocaleString()}
              {selectedWorkflow.completedAt && (
                <span> · Completed {new Date(selectedWorkflow.completedAt).toLocaleString()}</span>
              )}
            </div>

            <Separator className="my-4" />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/workflows/${selectedWorkflow.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        )}
      </Sheet>

      <Dialog open={actionDialogOpen && !!selectedWorkflow} onClose={() => setActionDialogOpen(false)} title="Advance Workflow">
        <div className="space-y-4">
          <Select
            label="Action"
            value={actionForm.action}
            onChange={(event) =>
              setActionForm((current) => ({ ...current, action: event.target.value }))
            }
            options={[
              { value: "approve", label: "Approve" },
              { value: "reject", label: "Reject" },
              { value: "skip", label: "Skip" },
              { value: "retry", label: "Retry" },
            ]}
          />
          <Select
            label="Next Step (optional)"
            value={actionForm.nextStepId}
            onChange={(event) =>
              setActionForm((current) => ({ ...current, nextStepId: event.target.value }))
            }
            options={[
              { value: "", label: "Automatic next step" },
              ...((selectedWorkflow?.steps || []).map((step) => ({
                value: step.id,
                label: `${step.name} (${step.id})`,
              }))),
            ]}
          />
          <Textarea
            label="Comment"
            value={actionForm.comment}
            onChange={(event) =>
              setActionForm((current) => ({ ...current, comment: event.target.value }))
            }
            placeholder="Decision context"
          />
          <Textarea
            label="Action Data (JSON)"
            value={actionForm.data}
            onChange={(event) =>
              setActionForm((current) => ({ ...current, data: event.target.value }))
            }
            placeholder='{"approvedBy":"ops-lead"}'
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={submitWorkflowAction} disabled={advanceMutation.isPending}>
              {advanceMutation.isPending ? "Submitting..." : "Submit Action"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={rollbackDialogOpen && !!selectedWorkflow} onClose={() => setRollbackDialogOpen(false)} title="Rollback Workflow">
        <div className="space-y-4">
          <Select
            label="Target Step"
            value={rollbackTargetStepId}
            onChange={(event) => setRollbackTargetStepId(event.target.value)}
            options={(selectedWorkflow?.steps || []).map((step) => ({
              value: step.id,
              label: `${step.name} (${step.id})`,
            }))}
          />
          <Textarea
            label="Reason"
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Why rollback is required"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                if (!selectedWorkflow || !rollbackTargetStepId) return;
                rollbackMutation.mutate({
                  id: selectedWorkflow.id,
                  targetStepId: rollbackTargetStepId,
                  reason: rollbackReason || undefined,
                });
              }}
              disabled={!rollbackTargetStepId || rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? "Rolling back..." : "Rollback"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={cancelDialogOpen && !!selectedWorkflow} onClose={() => setCancelDialogOpen(false)} title="Cancel Workflow">
        <div className="space-y-4">
          <Textarea
            label="Reason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Why this workflow is being cancelled"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedWorkflow || !cancelReason.trim()) return;
                cancelMutation.mutate({ id: selectedWorkflow.id, reason: cancelReason.trim() });
              }}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Workflow"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteDialogOpen && !!selectedWorkflow} onClose={() => setDeleteDialogOpen(false)} title="Delete Workflow">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete workflow <span className="font-medium text-foreground">{selectedWorkflow?.name}</span>? This action cannot be undone.
          </p>
          {selectedWorkflow && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-300">Linked entity warning</p>
              <ul className="mt-2 space-y-1 text-amber-700/90 dark:text-amber-300/90">
                {selectedWorkflow.incidentId ? (
                  <li>Incident link: {selectedWorkflow.incidentId}</li>
                ) : (
                  <li>Incident link: none</li>
                )}
                <li>
                  Related records: {selectedWorkflow.relatedRecords?.length || 0}
                </li>
                <li>Status: {selectedWorkflow.status.replace("_", " ")}</li>
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
