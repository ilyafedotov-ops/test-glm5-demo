"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  GitBranch,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Clock,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";

interface WorkflowDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  currentStepId?: string;
  incidentId?: string;
  systemRecordId?: string;
  relatedRecords?: Array<{
    type: string;
    id: string;
    systemRecordId: string;
    relationship?: string;
  }>;
  traceContext?: Record<string, unknown>;
  context?: Record<string, unknown>;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type?: string;
  status: string;
  assigneeId?: string;
  assignee?: { firstName: string; lastName: string };
  description?: string;
  nextSteps?: string[];
  config?: Record<string, unknown>;
  output?: Record<string, unknown>;
  completedAt?: string;
  notes?: string;
}

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface LinkedTaskResponse {
  data: LinkedTask[];
}

async function fetchWorkflow(token: string, id: string): Promise<WorkflowDetail> {
  const res = await fetch(`${API_URL}/workflows/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

async function fetchWorkflowTasks(token: string, workflowId: string): Promise<LinkedTaskResponse> {
  const res = await fetch(`${API_URL}/tasks?workflowId=${workflowId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch workflow tasks");
  return res.json();
}

async function advanceWorkflow(
  token: string,
  id: string,
  data: { action: string; comment?: string; nextStepId?: string; data?: Record<string, unknown> }
) {
  const res = await fetch(`${API_URL}/workflows/${id}/advance`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to advance workflow");
  }
  return res.json();
}

async function cancelWorkflow(token: string, id: string, reason: string) {
  const res = await fetch(`${API_URL}/workflows/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to cancel workflow");
  }
  return res.json();
}

async function rollbackWorkflow(token: string, id: string, targetStepId: string, reason: string) {
  const res = await fetch(`${API_URL}/workflows/${id}/rollback`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ targetStepId, reason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to rollback workflow");
  }
  return res.json();
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState("approve");
  const [nextStepId, setNextStepId] = useState("");
  const [actionDataJson, setActionDataJson] = useState("{}");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rollbackTargetStepId, setRollbackTargetStepId] = useState("");
  const [error, setError] = useState("");

  const workflowId = params["id"] as string;

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(token!, workflowId),
    enabled: isAuthenticated && !!token && !!workflowId,
  });

  const { data: linkedTasks } = useQuery({
    queryKey: ["workflow", workflowId, "tasks"],
    queryFn: () => fetchWorkflowTasks(token!, workflowId),
    enabled: isAuthenticated && !!token && !!workflowId,
  });

  const advanceMutation = useMutation({
    mutationFn: (payload: {
      action: string;
      comment?: string;
      nextStepId?: string;
      data?: Record<string, unknown>;
    }) => advanceWorkflow(token!, workflowId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setNotes("");
      setActionDataJson("{}");
      setNextStepId("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelWorkflow(token!, workflowId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setCancelDialogOpen(false);
      setCancelReason("");
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: () => {
      if (!rollbackTargetStepId) {
        throw new Error("Rollback target step is required");
      }

      return rollbackWorkflow(token!, workflowId, rollbackTargetStepId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      setNotes("");
      setRollbackTargetStepId("");
    },
  });

  if (!isAuthenticated) return null;

  const formatDate = (date: string | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-slate-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-emerald-500";
      case "cancelled":
        return "bg-rose-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-slate-200 dark:bg-slate-700";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-emerald-500";
      case "skipped":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const canAdvance = workflow?.status === "in_progress" || workflow?.status === "pending";
  const canRollback = workflow?.status === "in_progress";
  const canCancel = workflow?.status === "pending" || workflow?.status === "in_progress";
  const currentStepIndex = workflow
    ? workflow.steps.findIndex((step) => step.id === workflow.currentStepId || step.status === "in_progress")
    : -1;
  const stepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;
  const totalSteps = workflow?.steps?.length || 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => router.push("/workflows")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? "Loading..." : workflow?.name || "Workflow Details"}
            </h1>
            {workflow && (
              <Badge className={`${getStatusColor(workflow.status)} text-white border-0`}>
                {workflow.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Step {stepNumber} of {totalSteps} · Created {workflow ? formatDate(workflow.createdAt) : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {canAdvance && (
            <Button
              variant="gradient"
              onClick={() => advanceMutation.mutate({ action: "approve" })}
              disabled={advanceMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Advance
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass" className="animate-pulse h-64" />
          </div>
          <div className="space-y-6">
            <Card variant="glass" className="animate-pulse h-48" />
          </div>
        </div>
      ) : workflow ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Steps */}
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <GitBranch className="h-5 w-5 text-violet-500" />
                  </div>
                  Workflow Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-purple-500" />

                  <div className="space-y-6">
                    {workflow.steps?.map((step, index) => (
                      <div key={step.id} className="relative pl-12">
                        {/* Step Indicator */}
                        <div
                          className={`absolute left-0 top-0 h-10 w-10 rounded-full ${getStepStatusColor(
                            step.status
                          )} flex items-center justify-center text-white font-medium shadow-lg`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div
                          className={`p-4 rounded-xl border transition-all ${
                            step.status === "in_progress"
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{step.name}</h3>
                              {step.assignee && (
                                <p className="text-sm text-muted-foreground">
                                  Assigned to {step.assignee.firstName} {step.assignee.lastName}
                                </p>
                              )}
                              {step.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {step.notes}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={`${getStepStatusColor(step.status)} text-white border-0 text-xs`}
                            >
                              {step.status}
                            </Badge>
                          </div>
                          {step.completedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Completed {formatDate(step.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step Actions */}
            {canAdvance && (
              <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Step Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}
                  {(() => {
                    const currentStep = workflow?.steps?.find(s => s.status === "in_progress");
                    if (!currentStep) return null;
                    
                    return (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-muted-foreground mb-2">Current Step</p>
                        <h3 className="font-semibold text-lg">{currentStep.name}</h3>
                        <Badge className="mt-1" variant="outline">{currentStep.type || "manual"}</Badge>
                      </div>
                    );
                  })()}
                  
                  <Textarea
                    placeholder="Add notes (optional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Select
                    label="Action"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    options={[
                      { value: "approve", label: "Approve" },
                      { value: "reject", label: "Reject" },
                      { value: "skip", label: "Skip" },
                      { value: "retry", label: "Retry" },
                    ]}
                  />
                  <Select
                    label="Next Step (optional)"
                    value={nextStepId}
                    onChange={(e) => setNextStepId(e.target.value)}
                    options={[
                      { value: "", label: "Automatic next step" },
                      ...(workflow.steps || []).map((step) => ({
                        value: step.id,
                        label: `${step.name} (${step.id})`,
                      })),
                    ]}
                  />
                  <Textarea
                    label="Action Data (JSON)"
                    value={actionDataJson}
                    onChange={(e) => setActionDataJson(e.target.value)}
                    placeholder='{"key":"value"}'
                  />
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => {
                      let parsedData: Record<string, unknown> | undefined;
                      if (actionDataJson.trim()) {
                        try {
                          parsedData = JSON.parse(actionDataJson) as Record<string, unknown>;
                        } catch {
                          setError("Action data must be valid JSON");
                          return;
                        }
                      }
                      setError("");
                      advanceMutation.mutate({
                        action: actionType,
                        comment: notes || undefined,
                        nextStepId: nextStepId || undefined,
                        data: parsedData,
                      });
                    }}
                    disabled={advanceMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Action
                  </Button>

                  {canRollback && (
                    <div className="space-y-2">
                      <Select
                        label="Rollback Target"
                        value={rollbackTargetStepId}
                        onChange={(e) => setRollbackTargetStepId(e.target.value)}
                        options={(workflow.steps || []).map((step) => ({
                          value: step.id,
                          label: `${step.name} (${step.id})`,
                        }))}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => rollbackMutation.mutate()}
                        disabled={rollbackMutation.isPending || !rollbackTargetStepId}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workflow Info */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <GitBranch className="h-5 w-5 text-blue-500" />
                  </div>
                  Workflow Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(workflow.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(workflow.updatedAt)}</p>
                  </div>
                </div>
                {workflow.completedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{formatDate(workflow.completedAt)}</p>
                    </div>
                  </div>
                )}
                {workflow.systemRecordId ? <SystemRecordBadge value={workflow.systemRecordId} /> : null}
              </CardContent>
            </Card>

            {/* Related Incident */}
            {workflow.incidentId && (
              <Card
                variant="glass"
                className="animate-slide-up cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
                style={{ animationDelay: "300ms" }}
                onClick={() => router.push(`/incidents/${workflow.incidentId}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    Related Incident
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{workflow.incidentId}</p>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "325ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                    <User className="h-5 w-5 text-indigo-500" />
                  </div>
                  Unified Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RelatedRecordList records={workflow.relatedRecords || []} />
                {workflow.traceContext ? (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Trace Context</p>
                    <pre className="max-h-40 overflow-auto rounded-md bg-slate-950 p-2 text-xs text-slate-100">
                      {JSON.stringify(workflow.traceContext, null, 2)}
                    </pre>
                  </div>
                ) : null}
                {workflow.context ? (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Workflow Context</p>
                    <pre className="max-h-40 overflow-auto rounded-md bg-slate-950 p-2 text-xs text-slate-100">
                      {JSON.stringify(workflow.context, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "350ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                    <CheckCircle className="h-5 w-5 text-indigo-500" />
                  </div>
                  Linked Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {(linkedTasks?.data || []).length} task(s) linked to this workflow
                </p>
                {(linkedTasks?.data || []).slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="w-full rounded-lg border border-white/20 bg-white/20 px-3 py-2 text-left text-sm hover:bg-white/40 dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.status} · {task.priority}</p>
                  </button>
                ))}
                {(linkedTasks?.data || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No linked tasks yet.</p>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/tasks?workflowId=${workflow.id}`)}
                >
                  View All Linked Tasks
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workflow.incidentId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/incidents/${workflow.incidentId}`)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Incident
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/tasks?workflowId=${workflow.id}`)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  View Workflow Tasks
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/workflows")}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  All Workflows
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="text-center py-16">
            <GitBranch className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Workflow not found</p>
            <p className="text-muted-foreground mt-1">
              The workflow you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => router.push("/workflows")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Workflows
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel Workflow"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this workflow? This action cannot be undone.
          </p>
          <Textarea
            label="Reason"
            placeholder="Enter the reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Workflow"}
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
