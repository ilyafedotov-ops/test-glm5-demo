"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  CheckSquare,
  User,
  Calendar,
  CheckCircle,
  Play,
  RotateCcw,
  XCircle,
  Clock,
  Tag,
  AlertTriangle,
  Pencil,
  UserPlus,
  Trash2,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";

interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assigneeName?: string;
  reporterId?: string;
  reporterName?: string;
  dueAt?: string;
  startedAt?: string;
  completedAt?: string;
  teamId?: string;
  teamName?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
  slaStatus?: "on_track" | "at_risk" | "breached" | "completed";
  timeRemaining?: number;
  incidentId?: string;
  incidentTitle?: string;
  workflowId?: string;
  systemRecordId?: string;
  relatedRecords?: Array<{
    type: string;
    id: string;
    systemRecordId: string;
    relationship?: string;
  }>;
  traceContext?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

async function fetchTask(token: string, id: string): Promise<TaskDetail> {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

async function startTask(token: string, id: string, note?: string) {
  const res = await fetch(`${API_URL}/tasks/${id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Failed to start task");
  return res.json();
}

async function completeTask(token: string, id: string, actualMinutes?: number, note?: string) {
  const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ actualMinutes, note }),
  });
  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}

async function reopenTask(token: string, id: string, reason?: string) {
  const res = await fetch(`${API_URL}/tasks/${id}/reopen`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to reopen task");
  return res.json();
}

async function cancelTask(token: string, id: string, reason?: string) {
  const searchParams = new URLSearchParams();
  if (reason) {
    searchParams.set("reason", reason);
  }
  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/tasks/${id}/cancel${query ? `?${query}` : ""}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to cancel task");
  return res.json();
}

async function updateTask(
  token: string,
  id: string,
  data: { title?: string; description?: string; priority?: string; dueAt?: string | null }
) {
  const payload = {
    ...data,
    dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : null,
  };
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

async function assignTask(token: string, id: string, assigneeId?: string) {
  const res = await fetch(`${API_URL}/tasks/${id}/assign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeId: assigneeId || null }),
  });
  if (!res.ok) throw new Error("Failed to assign task");
  return res.json();
}

async function deleteTask(token: string, id: string) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

async function fetchUsers(token: string): Promise<UserOption[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch users");
  const payload = await res.json();
  if (Array.isArray(payload)) return payload;
  return payload.data || [];
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startNote, setStartNote] = useState("");
  const [completionMinutes, setCompletionMinutes] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueAt: "",
  });

  const taskId = params["id"] as string;

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(token!, taskId),
    enabled: isAuthenticated && !!token && !!taskId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["tasks", "users"],
    queryFn: () => fetchUsers(token!),
    enabled: isAuthenticated && !!token,
  });

  const startMutation = useMutation({
    mutationFn: () => startTask(token!, taskId, startNote || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setStartNote("");
      addToast({ type: "success", title: "Task started" });
    },
    onError: () => addToast({ type: "error", title: "Failed to start task" }),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      completeTask(
        token!,
        taskId,
        completionMinutes ? parseInt(completionMinutes, 10) : undefined,
        completionNote || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setCompletionMinutes("");
      setCompletionNote("");
      addToast({ type: "success", title: "Task completed" });
    },
    onError: () => addToast({ type: "error", title: "Failed to complete task" }),
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenTask(token!, taskId, reopenReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setReopenReason("");
      addToast({ type: "success", title: "Task reopened" });
    },
    onError: () => addToast({ type: "error", title: "Failed to reopen task" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelTask(token!, taskId, cancelReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setCancelReason("");
      addToast({ type: "success", title: "Task cancelled" });
    },
    onError: () => addToast({ type: "error", title: "Failed to cancel task" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateTask(token!, taskId, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditDialogOpen(false);
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => assignTask(token!, taskId, assignUserId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setAssignDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(token!, taskId),
    onSuccess: () => {
      router.push("/tasks");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  useEffect(() => {
    if (!task) return;
    setStartNote("");
    setCompletionMinutes("");
    setCompletionNote("");
    setReopenReason("");
    setCancelReason("");
    setAssignUserId(task.assigneeId || "");
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
    });
  }, [task]);

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
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-rose-600";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => router.push("/tasks")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? "Loading..." : task?.title || "Task Details"}
            </h1>
            {task && (
              <Badge className={`${getStatusColor(task.status)} text-white border-0`}>
                {task.status.replace("_", " ")}
              </Badge>
            )}
            {task && (
              <Badge className={`${getPriorityColor(task.priority)} text-white border-0`}>
                {task.priority}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Created {task ? formatDate(task.createdAt) : ""}
          </p>
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
      ) : task ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <CheckSquare className="h-5 w-5 text-amber-500" />
                  </div>
                  Task Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.assigneeName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Assignee</p>
                      <p className="font-medium">{task.assigneeName}</p>
                    </div>
                  </div>
                )}
                {task.reporterName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Reported By</p>
                      <p className="font-medium">{task.reporterName}</p>
                    </div>
                  </div>
                )}
                {task.teamName && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Team</p>
                      <p className="font-medium">{task.teamName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(task.dueAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(task.createdAt)}</p>
                  </div>
                </div>
                {task.startedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p className="font-medium">{formatDate(task.startedAt)}</p>
                    </div>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{formatDate(task.completedAt)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "250ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Lifecycle Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.status === "pending" && (
                  <>
                    <Textarea
                      label="Start Note (optional)"
                      placeholder="Context before starting this task"
                      value={startNote}
                      onChange={(event) => setStartNote(event.target.value)}
                    />
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => startMutation.mutate()}
                      disabled={startMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {startMutation.isPending ? "Starting..." : "Start Task"}
                    </Button>
                  </>
                )}

                {task.status === "in_progress" && (
                  <>
                    <Input
                      label="Actual Minutes (optional)"
                      type="number"
                      min={0}
                      value={completionMinutes}
                      onChange={(event) => setCompletionMinutes(event.target.value)}
                    />
                    <Textarea
                      label="Completion Note (optional)"
                      placeholder="What was completed?"
                      value={completionNote}
                      onChange={(event) => setCompletionNote(event.target.value)}
                    />
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {completeMutation.isPending ? "Completing..." : "Complete Task"}
                    </Button>
                  </>
                )}

                {(task.status === "pending" || task.status === "in_progress") && (
                  <>
                    <Textarea
                      label="Cancel Reason (optional)"
                      placeholder="Reason for cancellation"
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                    <Button
                      variant="outline"
                      className="w-full text-rose-600 hover:text-rose-700"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Task"}
                    </Button>
                  </>
                )}

                {(task.status === "completed" || task.status === "cancelled") && (
                  <>
                    <Textarea
                      label="Reopen Reason (optional)"
                      placeholder="Why this task needs reopening"
                      value={reopenReason}
                      onChange={(event) => setReopenReason(event.target.value)}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => reopenMutation.mutate()}
                      disabled={reopenMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {reopenMutation.isPending ? "Reopening..." : "Reopen Task"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {(task.incidentId || task.workflowId) && (
              <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                      <Tag className="h-5 w-5 text-indigo-500" />
                    </div>
                    Linked Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.incidentId && (
                    <div className="rounded-lg border border-white/20 bg-white/20 p-3 text-sm dark:border-white/10 dark:bg-slate-800/30">
                      <p className="text-xs text-muted-foreground">Incident</p>
                      <p className="font-medium mt-1">{task.incidentTitle || task.incidentId}</p>
                    </div>
                  )}
                  {task.workflowId && (
                    <div className="rounded-lg border border-white/20 bg-white/20 p-3 text-sm dark:border-white/10 dark:bg-slate-800/30">
                      <p className="text-xs text-muted-foreground">Workflow</p>
                      <p className="font-medium mt-1">{task.workflowId}</p>
                    </div>
                  )}
                  <div className="grid gap-2">
                    {task.incidentId && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push(`/tasks?incidentId=${task.incidentId}`)}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        View Incident Tasks
                      </Button>
                    )}
                    {task.workflowId && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push(`/tasks?workflowId=${task.workflowId}`)}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        View Workflow Tasks
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "325ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Unified Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.systemRecordId ? <SystemRecordBadge value={task.systemRecordId} /> : null}
                <RelatedRecordList records={task.relatedRecords || []} />
                {task.traceContext ? (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Trace Context</p>
                    <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-2 text-xs text-slate-100">
                      {JSON.stringify(task.traceContext, null, 2)}
                    </pre>
                  </div>
                ) : null}
                {task.metadata ? (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Metadata</p>
                    <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-2 text-xs text-slate-100">
                      {JSON.stringify(task.metadata, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.incidentId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/incidents/${task.incidentId}`)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Incident
                  </Button>
                )}
                {task.workflowId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/workflows/${task.workflowId}`)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    View Workflow
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-rose-600 hover:text-rose-700"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="text-center py-16">
            <CheckSquare className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Task not found</p>
            <p className="text-muted-foreground mt-1">
              The task you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => router.push("/tasks")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen && !!task} onClose={() => setEditDialogOpen(false)} title="Edit Task">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <Input
            label="Title"
            value={editForm.title}
            onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <Select
            label="Priority"
            value={editForm.priority}
            onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}
            options={[
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <Input
            label="Due Date"
            type="datetime-local"
            value={editForm.dueAt}
            onChange={(event) => setEditForm((current) => ({ ...current, dueAt: event.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={assignDialogOpen && !!task} onClose={() => setAssignDialogOpen(false)} title="Assign Task">
        <div className="space-y-4">
          <Select
            label="Assignee"
            value={assignUserId}
            onChange={(event) => setAssignUserId(event.target.value)}
            options={[
              { value: "", label: "Unassigned" },
              ...users.map((user) => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName} (${user.email})`,
              })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Updating..." : "Update Assignee"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteDialogOpen && !!task} onClose={() => setDeleteDialogOpen(false)} title="Delete Task">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete task <span className="font-medium text-foreground">{task?.title}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
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
