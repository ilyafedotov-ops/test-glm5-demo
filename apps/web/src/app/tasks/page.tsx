"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  CheckSquare, Plus, Search, Calendar, RefreshCw,
  CheckCircle2, Circle, Play, XCircle, AlertTriangle, LayoutGrid, List,
  Timer, Flame, Tag, ExternalLink, Filter, UserPlus, Pencil, Trash2
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
import { SystemRecordBadge } from "@/components/operations/system-record-badge";
import { RelatedRecordList } from "@/components/operations/related-record-list";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assigneeName?: string;
  reporterId?: string;
  reporterName?: string;
  incidentId?: string;
  incidentTitle?: string;
  teamId?: string;
  teamName?: string;
  workflowId?: string;
  violationId?: string;
  policyId?: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  dueAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
  slaStatus?: "on_track" | "at_risk" | "breached" | "completed";
  timeRemaining?: number;
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
}

interface TaskResponse {
  data: Task[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  critical: number;
  high: number;
  avgCompletionTime: number;
}

async function fetchTasks(
  token: string,
  filters?: {
    incidentId?: string;
    workflowId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    teamId?: string;
    violationId?: string;
    policyId?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    systemRecordId?: string;
    overdue?: boolean;
    dueFrom?: string;
    dueTo?: string;
    search?: string;
  }
): Promise<TaskResponse> {
  const searchParams = new URLSearchParams();
  if (filters?.incidentId) {
    searchParams.set("incidentId", filters.incidentId);
  }
  if (filters?.workflowId) {
    searchParams.set("workflowId", filters.workflowId);
  }
  if (filters?.status) {
    searchParams.set("status", filters.status);
  }
  if (filters?.priority) {
    searchParams.set("priority", filters.priority);
  }
  if (filters?.assigneeId) {
    searchParams.set("assigneeId", filters.assigneeId);
  }
  if (filters?.teamId) {
    searchParams.set("teamId", filters.teamId);
  }
  if (filters?.violationId) {
    searchParams.set("violationId", filters.violationId);
  }
  if (filters?.policyId) {
    searchParams.set("policyId", filters.policyId);
  }
  if (filters?.sourceEntityType) {
    searchParams.set("sourceEntityType", filters.sourceEntityType);
  }
  if (filters?.sourceEntityId) {
    searchParams.set("sourceEntityId", filters.sourceEntityId);
  }
  if (filters?.systemRecordId) {
    searchParams.set("systemRecordId", filters.systemRecordId);
  }
  if (filters?.overdue) {
    searchParams.set("overdue", "true");
  }
  if (filters?.dueFrom) {
    searchParams.set("dueFrom", filters.dueFrom);
  }
  if (filters?.dueTo) {
    searchParams.set("dueTo", filters.dueTo);
  }
  if (filters?.search) {
    searchParams.set("search", filters.search);
  }

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/tasks${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchTaskOptions(token: string): Promise<{
  users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  teams: Array<{ id: string; name: string }>;
}> {
  const res = await fetch(`${API_URL}/tasks/options`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch task options");
  return res.json();
}

async function fetchTaskStats(token: string): Promise<TaskStats> {
  const res = await fetch(`${API_URL}/tasks/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function createTask(
  token: string,
  data: {
    title: string;
    description?: string;
    priority: string;
    dueAt?: string;
    assigneeId?: string;
    incidentId?: string;
    workflowId?: string;
    teamId?: string;
    violationId?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    estimatedMinutes?: number;
    tags?: string[];
  }
) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
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

async function deleteTask(token: string, id: string) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

const priorityConfig = {
  critical: { icon: Flame, gradient: "from-rose-600 to-pink-600", bg: "bg-rose-500/10", color: "text-rose-600", label: "Critical" },
  high: { icon: AlertTriangle, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500/10", color: "text-orange-600", label: "High" },
  medium: { icon: Circle, gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-500/10", color: "text-amber-600", label: "Medium" },
  low: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", color: "text-emerald-600", label: "Low" },
} as const;

const statusConfig = {
  pending: { icon: Circle, bg: "bg-slate-500/10", color: "text-slate-600", label: "Pending" },
  in_progress: { icon: Play, bg: "bg-blue-500/10", color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-600", label: "Completed" },
  cancelled: { icon: XCircle, bg: "bg-gray-500/10", color: "text-gray-500", label: "Cancelled" },
} as const;

const slaConfig = {
  on_track: { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "On Track" },
  at_risk: { color: "text-amber-500", bg: "bg-amber-500/10", label: "At Risk" },
  breached: { color: "text-rose-500", bg: "bg-rose-500/10", label: "Breached" },
  completed: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Completed" },
};

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedIncidentId = (searchParams.get("incidentId") || "").trim();
  const scopedWorkflowId = (searchParams.get("workflowId") || "").trim();
  const hasScopeFilters = scopedIncidentId.length > 0 || scopedWorkflowId.length > 0;
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [violationFilter, setViolationFilter] = useState("");
  const [policyFilter, setPolicyFilter] = useState("");
  const [sourceEntityTypeFilter, setSourceEntityTypeFilter] = useState("");
  const [sourceEntityIdFilter, setSourceEntityIdFilter] = useState("");
  const [systemRecordFilter, setSystemRecordFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dueFromFilter, setDueFromFilter] = useState("");
  const [dueToFilter, setDueToFilter] = useState("");
  const [slaStatusFilter, setSlaStatusFilter] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueAt: "",
    assigneeId: "",
    incidentId: scopedIncidentId,
    workflowId: scopedWorkflowId,
    teamId: "",
    violationId: "",
    sourceEntityType: "",
    sourceEntityId: "",
    estimatedMinutes: "",
    tagsInput: "",
  });
  const [completionMinutes, setCompletionMinutes] = useState("");
  const [startNote, setStartNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueAt: "",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      incidentId: scopedIncidentId,
      workflowId: scopedWorkflowId,
    }));
  }, [scopedIncidentId, scopedWorkflowId]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setDialogOpen(true);
      router.replace("/tasks", { scroll: false });
    }
  }, [searchParams, router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "tasks",
      scopedIncidentId,
      scopedWorkflowId,
      statusFilter,
      priorityFilter,
      assigneeFilter,
      teamFilter,
      violationFilter,
      policyFilter,
      sourceEntityTypeFilter,
      sourceEntityIdFilter,
      systemRecordFilter,
      overdueOnly,
      dueFromFilter,
      dueToFilter,
      searchTerm,
    ],
    queryFn: () =>
      fetchTasks(token!, {
        incidentId: scopedIncidentId || undefined,
        workflowId: scopedWorkflowId || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assigneeId: assigneeFilter || undefined,
        teamId: teamFilter || undefined,
        violationId: violationFilter || undefined,
        policyId: policyFilter || undefined,
        sourceEntityType: sourceEntityTypeFilter || undefined,
        sourceEntityId: sourceEntityIdFilter || undefined,
        systemRecordId: systemRecordFilter || undefined,
        overdue: overdueOnly || undefined,
        dueFrom: dueFromFilter ? new Date(dueFromFilter).toISOString() : undefined,
        dueTo: dueToFilter ? new Date(dueToFilter).toISOString() : undefined,
        search: searchTerm || undefined,
      }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: taskOptions } = useQuery({
    queryKey: ["tasks", "options"],
    queryFn: () => fetchTaskOptions(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const users = taskOptions?.users ?? [];
  const teams = taskOptions?.teams ?? [];

  const { data: stats } = useQuery({
    queryKey: ["tasks", "stats"],
    queryFn: () => fetchTaskStats(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => createTask(token!, {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      dueAt: formData.dueAt || undefined,
      assigneeId: formData.assigneeId || undefined,
      incidentId: formData.incidentId || undefined,
      workflowId: formData.workflowId || undefined,
      teamId: formData.teamId || undefined,
      violationId: formData.violationId || undefined,
      sourceEntityType: formData.sourceEntityType || undefined,
      sourceEntityId: formData.sourceEntityId || undefined,
      estimatedMinutes: formData.estimatedMinutes
        ? parseInt(formData.estimatedMinutes, 10)
        : undefined,
      tags: formData.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueAt: "",
        assigneeId: "",
        incidentId: scopedIncidentId,
        workflowId: scopedWorkflowId,
        teamId: "",
        violationId: "",
        sourceEntityType: "",
        sourceEntityId: "",
        estimatedMinutes: "",
        tagsInput: "",
      });
      setError("");
      addToast({ type: "success", title: "Task created" });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create task");
      addToast({ type: "error", title: "Failed to create task" });
    },
  });

  const startMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => startTask(token!, id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setStartNote("");
      addToast({ type: "success", title: "Task started" });
    },
    onError: () => addToast({ type: "error", title: "Failed to start task" }),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, minutes, note }: { id: string; minutes?: number; note?: string }) =>
      completeTask(token!, id, minutes, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedTask(null);
      setCompletionMinutes("");
      setCompletionNote("");
      addToast({ type: "success", title: "Task completed" });
    },
    onError: () => addToast({ type: "error", title: "Failed to complete task" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateTask(token!, selectedTask!.id, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditDialogOpen(false);
      addToast({ type: "success", title: "Task updated" });
    },
    onError: () => addToast({ type: "error", title: "Failed to update task" }),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignTask(token!, selectedTask!.id, assignUserId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setAssignDialogOpen(false);
      addToast({ type: "success", title: "Task assignee updated" });
    },
    onError: () => addToast({ type: "error", title: "Failed to assign task" }),
  });

  const reopenMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => reopenTask(token!, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setReopenReason("");
      addToast({ type: "success", title: "Task reopened" });
    },
    onError: () => addToast({ type: "error", title: "Failed to reopen task" }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelTask(token!, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setCancelReason("");
      addToast({ type: "success", title: "Task cancelled" });
    },
    onError: () => addToast({ type: "error", title: "Failed to cancel task" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(token!, selectedTask!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      addToast({ type: "success", title: "Task deleted" });
    },
    onError: () => addToast({ type: "error", title: "Failed to delete task" }),
  });

  useEffect(() => {
    if (!selectedTask) return;
    setStartNote("");
    setCompletionMinutes("");
    setCompletionNote("");
    setReopenReason("");
    setCancelReason("");
    setAssignUserId(selectedTask.assigneeId || "");
    setEditForm({
      title: selectedTask.title || "",
      description: selectedTask.description || "",
      priority: selectedTask.priority || "medium",
      dueAt: selectedTask.dueAt
        ? new Date(selectedTask.dueAt).toISOString().slice(0, 16)
        : "",
    });
  }, [selectedTask]);

  if (!isAuthenticated) return null;

  const tasks = data?.data || [];
  const filteredTasks = slaStatusFilter
    ? tasks.filter((t) => {
        if (slaStatusFilter === "on_track") return t.slaStatus === "on_track";
        if (slaStatusFilter === "at_risk") return t.slaStatus === "at_risk";
        if (slaStatusFilter === "breached") return t.slaStatus === "breached";
        if (slaStatusFilter === "completed") return t.slaStatus === "completed";
        return true;
      })
    : tasks;

  const scopedStats = {
    total: filteredTasks.length,
    inProgress: filteredTasks.filter((task) => task.status === "in_progress").length,
    completed: filteredTasks.filter((task) => task.status === "completed").length,
    overdue: filteredTasks.filter((task) => {
      if (!task.dueAt) return false;
      if (task.status === "completed" || task.status === "cancelled") return false;
      return new Date(task.dueAt).getTime() < Date.now();
    }).length,
  };

  const dashboardStats = hasScopeFilters
    ? scopedStats
    : {
        total: stats?.total || 0,
        inProgress: stats?.inProgress || 0,
        completed: stats?.completed || 0,
        overdue: stats?.overdue || 0,
      };

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === "pending"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    completed: filteredTasks.filter(t => t.status === "completed"),
    cancelled: filteredTasks.filter(t => t.status === "cancelled"),
  };
  const activeFilterCount = [
    statusFilter,
    priorityFilter,
    assigneeFilter,
    teamFilter,
    violationFilter,
    policyFilter,
    sourceEntityTypeFilter,
    sourceEntityIdFilter,
    systemRecordFilter,
    slaStatusFilter,
    dueFromFilter,
    dueToFilter,
    overdueOnly ? "overdue" : "",
  ].filter(Boolean).length;

  const getPriorityStyle = (priority: string) =>
    priorityConfig[priority as keyof typeof priorityConfig] ?? priorityConfig.medium;

  const getStatusStyle = (status: string) =>
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    createMutation.mutate();
  };

  const renderTaskCard = (task: Task) => {
    const priorityStyle = getPriorityStyle(task.priority);
    const slaStyle = task.slaStatus ? slaConfig[task.slaStatus] : null;

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className="group p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 cursor-pointer transition-all duration-200 hover:shadow-lg"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <span className={`px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${priorityStyle.gradient} text-white flex-shrink-0 ml-2`}>
            {priorityStyle.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {task.incidentId && (
            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-700 dark:text-amber-300">
              Incident
            </Badge>
          )}
          {task.workflowId && (
            <Badge variant="outline" className="text-xs border-indigo-500/40 text-indigo-700 dark:text-indigo-300">
              Workflow
            </Badge>
          )}
          {task.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs">
          {task.assigneeName ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                  {task.assigneeName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{task.assigneeName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}

          {task.timeRemaining !== undefined && task.slaStatus !== 'completed' && (
            <span className={`flex items-center gap-1 ${slaStyle?.color}`}>
              <Timer className="h-3 w-3" />
              {formatTimeRemaining(task.timeRemaining)}
            </span>
          )}
        </div>

        {task.dueAt && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {new Date(task.dueAt).toLocaleDateString()}
          </div>
        )}

        {task.systemRecordId && (
          <div className="mt-2">
            <SystemRecordBadge value={task.systemRecordId} compact />
          </div>
        )}
      </div>
    );
  };

  return (
      <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track tasks with SLA monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {hasScopeFilters && (
        <Card variant="glass" className="animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Scoped task view</p>
                <p className="text-xs text-muted-foreground">
                  {scopedIncidentId ? <>Incident <code>{scopedIncidentId}</code></> : null}
                  {scopedIncidentId && scopedWorkflowId ? " · " : null}
                  {scopedWorkflowId ? <>Workflow <code>{scopedWorkflowId}</code></> : null}
                </p>
              </div>
              <div className="flex gap-2">
                {scopedIncidentId && (
                  <Button size="sm" variant="outline" onClick={() => router.push(`/incidents/${scopedIncidentId}`)}>
                    View Incident
                  </Button>
                )}
                {scopedWorkflowId && (
                  <Button size="sm" variant="outline" onClick={() => router.push(`/workflows/${scopedWorkflowId}`)}>
                    View Workflow
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => router.push("/tasks")}>
                  Clear Scope
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card variant="glass" className="group overflow-hidden animate-slide-up">
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold mt-1">{dashboardStats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-1 text-blue-500">{dashboardStats.inProgress}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold mt-1 text-rose-500">{dashboardStats.overdue}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-1 text-emerald-500">{dashboardStats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        <Button variant="glass" onClick={() => setFilterDialogOpen(true)}>
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
          )}
        </Button>
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
          <Button
            variant={viewMode === "kanban" ? "gradient" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "gradient" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid gap-6 md:grid-cols-4 animate-slide-up" style={{ animationDelay: '500ms' }}>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const statusStyle = getStatusStyle(status);
            const StatusIcon = statusStyle.icon;
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <StatusIcon className={`h-4 w-4 ${statusStyle.color}`} />
                  <h3 className="font-semibold text-sm">{statusStyle.label}</h3>
                  <Badge variant="secondary" className="text-xs">{statusTasks.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px] p-2 rounded-xl bg-muted/20 border border-dashed border-white/10">
                  {statusTasks.map(renderTaskCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardContent className="pt-6">
            {filteredTasks.length > 0 ? (
              <div className="space-y-2">
                {filteredTasks.map(task => {
                  const priorityStyle = getPriorityStyle(task.priority);
                  const statusStyle = getStatusStyle(task.status);
                  const StatusIcon = statusStyle.icon;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                    >
                      <StatusIcon className={`h-5 w-5 ${statusStyle.color}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {task.assigneeName && <span>{task.assigneeName}</span>}
                          {task.dueAt && <span>Due {new Date(task.dueAt).toLocaleDateString()}</span>}
                          {task.incidentId && <span>Incident linked</span>}
                          {task.workflowId && <span>Workflow linked</span>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${priorityStyle.gradient} text-white`}>
                        {priorityStyle.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>No tasks found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create New Task" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>}
          <Input
            label="Title"
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Task description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
            value={formData.dueAt}
            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Assignee"
              value={formData.assigneeId}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              options={[
                { value: "", label: "Unassigned" },
                ...users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
              ]}
            />
            <Select
              label="Team"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              options={[
                { value: "", label: "No team" },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
          <Input
            label="Incident ID (Optional)"
            placeholder="Link to incident"
            value={formData.incidentId}
            onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
          />
          <Input
            label="Workflow ID (Optional)"
            placeholder="Link to workflow"
            value={formData.workflowId}
            onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
          />
          <Input
            label="Violation ID (Optional)"
            placeholder="Link to violation"
            value={formData.violationId}
            onChange={(e) => setFormData({ ...formData, violationId: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Source Entity Type"
              value={formData.sourceEntityType}
              onChange={(e) => setFormData({ ...formData, sourceEntityType: e.target.value })}
              options={[
                { value: "", label: "None" },
                { value: "workflow", label: "Workflow" },
                { value: "incident", label: "Incident" },
                { value: "violation", label: "Violation" },
                { value: "policy", label: "Policy" },
                { value: "problem", label: "Problem" },
                { value: "change", label: "Change" },
              ]}
            />
            <Input
              label="Source Entity ID"
              placeholder="Origin record ID"
              value={formData.sourceEntityId}
              onChange={(e) => setFormData({ ...formData, sourceEntityId: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Estimated Minutes"
              type="number"
              min={0}
              value={formData.estimatedMinutes}
              onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
            />
            <Input
              label="Tags"
              placeholder="ops, escalation, customer"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Task Detail Sheet */}
      <Sheet
        open={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setCompletionMinutes("");
          setStartNote("");
          setCompletionNote("");
          setReopenReason("");
          setCancelReason("");
        }}
        title={selectedTask?.title}
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${getPriorityStyle(selectedTask.priority).gradient} text-white`}>
                {getPriorityStyle(selectedTask.priority).label}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusStyle(selectedTask.status).bg} ${getStatusStyle(selectedTask.status).color}`}>
                {getStatusStyle(selectedTask.status).label}
              </span>
              {selectedTask.slaStatus && (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${slaConfig[selectedTask.slaStatus].bg} ${slaConfig[selectedTask.slaStatus].color}`}>
                  {slaConfig[selectedTask.slaStatus].label}
                </span>
              )}
            </div>

            {selectedTask.description && (
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedTask.assigneeName && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Assignee</span>
                  <p className="font-medium mt-1">{selectedTask.assigneeName}</p>
                </div>
              )}
              {selectedTask.dueAt && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Due Date</span>
                  <p className="font-medium mt-1">{new Date(selectedTask.dueAt).toLocaleString()}</p>
                </div>
              )}
              {selectedTask.timeRemaining !== undefined && selectedTask.slaStatus !== 'completed' && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Time Remaining</span>
                  <p className={`font-medium mt-1 ${selectedTask.timeRemaining < 0 ? 'text-rose-500' : ''}`}>
                    {formatTimeRemaining(selectedTask.timeRemaining)}
                  </p>
                </div>
              )}
              {selectedTask.estimatedMinutes && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Estimated</span>
                  <p className="font-medium mt-1">{selectedTask.estimatedMinutes} minutes</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Linked Records</h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedTask.incidentId && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/incidents/${selectedTask.incidentId}`)}
                  >
                    View Linked Incident
                  </Button>
                )}
                {selectedTask.workflowId && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/workflows/${selectedTask.workflowId}`)}
                  >
                    View Linked Workflow
                  </Button>
                )}
                {selectedTask.violationId && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/violations/${selectedTask.violationId}`)}
                  >
                    View Linked Violation
                  </Button>
                )}
                {selectedTask.incidentId && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/tasks?incidentId=${selectedTask.incidentId}`)}
                  >
                    View Incident Tasks
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Unified Record</h4>
              {selectedTask.systemRecordId && (
                <SystemRecordBadge value={selectedTask.systemRecordId} />
              )}
              <RelatedRecordList records={selectedTask.relatedRecords || []} />
              {selectedTask.traceContext ? (
                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(selectedTask.traceContext, null, 2)}
                </pre>
              ) : null}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
              {selectedTask.status === "pending" && (
                <div className="space-y-2">
                  <Textarea
                    label="Start Note (optional)"
                    placeholder="Context before starting this task"
                    value={startNote}
                    onChange={(event) => setStartNote(event.target.value)}
                  />
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => startMutation.mutate({ id: selectedTask.id, note: startNote || undefined })}
                    disabled={startMutation.isPending}
                  >
                    <Play className="h-4 w-4" />
                    Start Task
                  </Button>
                </div>
              )}

              {selectedTask.status === "in_progress" && (
                <div className="space-y-3">
                  <Input
                    label="Actual Minutes (optional)"
                    type="number"
                    placeholder="How long did this take?"
                    value={completionMinutes}
                    onChange={(e) => setCompletionMinutes(e.target.value)}
                  />
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => completeMutation.mutate({
                      id: selectedTask.id,
                      minutes: completionMinutes ? parseInt(completionMinutes, 10) : undefined,
                      note: completionNote || undefined,
                    })}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Task
                  </Button>
                  <Textarea
                    label="Completion Note (optional)"
                    placeholder="What was done to complete this task?"
                    value={completionNote}
                    onChange={(event) => setCompletionNote(event.target.value)}
                  />
                </div>
              )}

              {(selectedTask.status === "pending" || selectedTask.status === "in_progress") && (
                <div className="space-y-2">
                  <Input
                    label="Cancel Reason (optional)"
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full text-rose-600 hover:text-rose-700"
                    onClick={() => cancelMutation.mutate({ id: selectedTask.id, reason: cancelReason || undefined })}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Task
                  </Button>
                </div>
              )}

              {(selectedTask.status === "completed" || selectedTask.status === "cancelled") && (
                <div className="space-y-2">
                  <Input
                    label="Reopen Reason (optional)"
                    placeholder="Why is this task reopening?"
                    value={reopenReason}
                    onChange={(event) => setReopenReason(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      reopenMutation.mutate({
                        id: selectedTask.id,
                        reason: reopenReason || undefined,
                      })
                    }
                    disabled={reopenMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reopen Task
                  </Button>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="w-full" onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setAssignDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-rose-600 hover:text-rose-700"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Created {new Date(selectedTask.createdAt).toLocaleString()}
            </div>

            <Separator className="my-4" />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/tasks/${selectedTask.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        )}
      </Sheet>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} title="Task Filters">
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
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            options={[
              { value: "", label: "All priorities" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <Select
            label="Assignee"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            options={[
              { value: "", label: "All assignees" },
              ...users.map((user) => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName}`,
              })),
            ]}
          />
          <Select
            label="SLA Status"
            value={slaStatusFilter}
            onChange={(event) => setSlaStatusFilter(event.target.value)}
            options={[
              { value: "", label: "All SLA statuses" },
              { value: "on_track", label: "On Track" },
              { value: "at_risk", label: "At Risk" },
              { value: "breached", label: "Breached" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <Select
            label="Team"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            options={[
              { value: "", label: "All teams" },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
          <Input
            label="Violation ID"
            value={violationFilter}
            onChange={(event) => setViolationFilter(event.target.value)}
            placeholder="Filter by violation UUID"
          />
          <Input
            label="Policy ID"
            value={policyFilter}
            onChange={(event) => setPolicyFilter(event.target.value)}
            placeholder="Filter by policy UUID"
          />
          <Select
            label="Source Entity Type"
            value={sourceEntityTypeFilter}
            onChange={(event) => setSourceEntityTypeFilter(event.target.value)}
            options={[
              { value: "", label: "All source types" },
              { value: "workflow", label: "Workflow" },
              { value: "incident", label: "Incident" },
              { value: "violation", label: "Violation" },
              { value: "policy", label: "Policy" },
              { value: "problem", label: "Problem" },
              { value: "change", label: "Change" },
            ]}
          />
          <Input
            label="Source Entity ID"
            value={sourceEntityIdFilter}
            onChange={(event) => setSourceEntityIdFilter(event.target.value)}
            placeholder="Filter by source entity ID"
          />
          <Input
            label="System Record ID"
            value={systemRecordFilter}
            onChange={(event) => setSystemRecordFilter(event.target.value)}
            placeholder="task:<id> or workflow:<id>"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Due From"
              type="datetime-local"
              value={dueFromFilter}
              onChange={(event) => setDueFromFilter(event.target.value)}
            />
            <Input
              label="Due To"
              type="datetime-local"
              value={dueToFilter}
              onChange={(event) => setDueToFilter(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2 dark:border-white/10 dark:bg-slate-800/30">
            <span className="text-sm">Overdue only</span>
            <Button
              size="sm"
              variant={overdueOnly ? "gradient" : "outline"}
              onClick={() => setOverdueOnly((current) => !current)}
            >
              {overdueOnly ? "Enabled" : "Disabled"}
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
                setAssigneeFilter("");
                setTeamFilter("");
                setViolationFilter("");
                setPolicyFilter("");
                setSourceEntityTypeFilter("");
                setSourceEntityIdFilter("");
                setSystemRecordFilter("");
                setSlaStatusFilter("");
                setOverdueOnly(false);
                setDueFromFilter("");
                setDueToFilter("");
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

      <Dialog open={editDialogOpen && !!selectedTask} onClose={() => setEditDialogOpen(false)} title="Edit Task">
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
            onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
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

      <Dialog open={assignDialogOpen && !!selectedTask} onClose={() => setAssignDialogOpen(false)} title="Assign Task">
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

      <Dialog open={deleteDialogOpen && !!selectedTask} onClose={() => setDeleteDialogOpen(false)} title="Delete Task">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete task <span className="font-medium text-foreground">{selectedTask?.title}</span>? This action cannot be undone.
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
