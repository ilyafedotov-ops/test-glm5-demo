"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  Activity,
  Tag,
  Play,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChannelBadge, TicketNumberBadge } from "@/components/ui/ticket-badge";
import { ImpactUrgencyBadge, PriorityBadge } from "@/components/ui/priority-matrix";
import { SLAIndicator } from "@/components/ui/sla-indicator";

interface IncidentDetail {
  id: string;
  ticketNumber?: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  impact?: "critical" | "high" | "medium" | "low";
  urgency?: "critical" | "high" | "medium" | "low";
  channel?: "portal" | "email" | "phone" | "chat" | "api";
  category?: { id: string; name: string } | null;
  organizationId: string;
  teamId: string | null;
  assigneeId: string | null;
  reporterId: string;
  tags: string[];
  dueAt: string | null;
  slaResponseDue?: string | null;
  slaResolutionDue?: string | null;
  onHoldReason?: string | null;
  onHoldUntil?: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  reporter?: { id: string; firstName: string; lastName: string; email: string };
  comments?: IncidentComment[];
  timeline?: IncidentTimelineEvent[];
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

const STATUS_TRANSITIONS: Array<{ value: string; label: string }> = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
  { value: "cancelled", label: "Cancelled" },
];

interface IncidentComment {
  id: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

interface IncidentTimelineEvent {
  id: string;
  action: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string };
}

async function fetchIncident(token: string, id: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch incident");
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
  }
) {
  const res = await fetch(`${API_URL}/incidents/${id}/transition`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || "Failed to transition incident");
  }
  return res.json();
}

async function addComment(token: string, incidentId: string, content: string) {
  const res = await fetch(`${API_URL}/incidents/${incidentId}/comments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [transitionForm, setTransitionForm] = useState({
    toStatus: "assigned",
    reason: "",
    pendingReason: "",
    resolutionSummary: "",
    closureCode: "",
    comment: "",
    onHoldUntil: "",
  });
  const [error, setError] = useState("");

  const incidentId = params["id"] as string;

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => fetchIncident(token!, incidentId),
    enabled: isAuthenticated && !!token && !!incidentId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      toStatus: string;
      reason?: string;
      pendingReason?: string;
      resolutionSummary?: string;
      closureCode?: string;
      comment?: string;
      onHoldUntil?: string;
    }) => transitionIncident(token!, incidentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment(token!, incidentId, commentText),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
    },
  });

  if (!isAuthenticated) return null;

  const formatDate = (date: string | null) => {
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
      case "open":
        return "bg-blue-500";
      case "in_progress":
        return "bg-amber-500";
      case "resolved":
        return "bg-emerald-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const openWorkflowTaskCount = (incident?.tasks || []).filter(
    (task) => !!task.workflowId && ["pending", "in_progress"].includes(task.status)
  ).length;

  const openTransitionDialog = () => {
    setTransitionForm({
      toStatus: incident?.status === "new" ? "assigned" : "in_progress",
      reason: "",
      pendingReason: "",
      resolutionSummary: "",
      closureCode: "",
      comment: "",
      onHoldUntil: "",
    });
    setError("");
    setTransitionDialogOpen(true);
  };

  const submitTransition = () => {
    if (transitionForm.toStatus === "pending" && !transitionForm.pendingReason.trim()) {
      setError("Pending reason is required");
      return;
    }
    if (transitionForm.toStatus === "resolved" && !transitionForm.resolutionSummary.trim()) {
      setError("Resolution summary is required");
      return;
    }
    if (transitionForm.toStatus === "closed" && !transitionForm.closureCode.trim()) {
      setError("Closure code is required");
      return;
    }
    if (transitionForm.toStatus === "cancelled" && !transitionForm.reason.trim()) {
      setError("Cancellation reason is required");
      return;
    }

    setError("");
    updateMutation.mutate(
      {
        toStatus: transitionForm.toStatus,
        reason: transitionForm.reason || undefined,
        pendingReason: transitionForm.pendingReason || undefined,
        resolutionSummary: transitionForm.resolutionSummary || undefined,
        closureCode: transitionForm.closureCode || undefined,
        comment: transitionForm.comment || undefined,
        onHoldUntil: transitionForm.onHoldUntil || undefined,
      },
      {
        onSuccess: () => setTransitionDialogOpen(false),
      }
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => router.push("/incidents")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? "Loading..." : incident?.title || "Incident Details"}
            </h1>
            {incident && (
              <TicketNumberBadge ticketNumber={incident.ticketNumber || `INC-${incident.id.slice(0, 8).toUpperCase()}`} compact />
            )}
            {incident && (
              <Badge className={`${getStatusColor(incident.status)} text-white border-0`}>
                {incident.status.replace("_", " ")}
              </Badge>
            )}
            {incident?.priority ? <PriorityBadge priority={incident.priority} /> : null}
            {incident?.impact && incident?.urgency ? (
              <ImpactUrgencyBadge impact={incident.impact} urgency={incident.urgency} />
            ) : null}
            {incident?.channel ? <ChannelBadge channel={incident.channel} /> : null}
          </div>
          <p className="text-muted-foreground mt-1">
            Created {incident ? formatDate(incident.createdAt) : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTransitionDialog}>
            <Play className="h-4 w-4 mr-2" />
            Transition
          </Button>
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
      ) : incident ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <AlertTriangle className="h-5 w-5 text-violet-500" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {incident.description}
                </p>
              </CardContent>
            </Card>

            {(incident.slaResponseDue || incident.slaResolutionDue) && (
              <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "50ms" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    SLA Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incident.slaResponseDue ? <SLAIndicator dueAt={incident.slaResponseDue} type="response" /> : null}
                  {incident.slaResolutionDue ? <SLAIndicator dueAt={incident.slaResolutionDue} type="resolution" /> : null}
                  {incident.onHoldReason ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                      On hold: {incident.onHoldReason}
                      {incident.onHoldUntil ? ` until ${formatDate(incident.onHoldUntil)}` : ""}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  Comments
                  {incident.comments && (
                    <Badge variant="secondary" className="ml-2">
                      {incident.comments.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incident.comments && incident.comments.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {incident.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {comment.author?.firstName?.[0] || "U"}
                            {comment.author?.lastName?.[0] || ""}
                          </div>
                          <span className="font-medium text-sm">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">Internal</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground pl-10">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No comments yet
                  </p>
                )}

                {/* Add Comment */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    variant="gradient"
                    onClick={() => commentMutation.mutate()}
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </div>
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incident.timeline && incident.timeline.length > 0 ? (
                  <div className="relative border-l-2 border-white/20 ml-4 space-y-4">
                    {incident.timeline.map((event) => (
                      <div key={event.id} className="ml-4 relative">
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-500" />
                        <div className="text-sm">
                          <span className="font-medium">{event.action}</span>
                          {event.actor && (
                            <span className="text-muted-foreground">
                              {" "}by {event.actor.firstName} {event.actor.lastName}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No timeline events
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Linked Workflow & Tasks */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "250ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                    <Activity className="h-5 w-5 text-indigo-500" />
                  </div>
                  Linked Workflow & Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                  <p className="text-xs text-muted-foreground">Workflows</p>
                  <p className="text-2xl font-semibold">{incident.workflows?.length || 0}</p>
                  <div className="space-y-1">
                    {(incident.workflows || []).slice(0, 4).map((workflow) => (
                      <button
                        key={workflow.id}
                        type="button"
                        className="block w-full text-left text-xs rounded-lg px-2 py-1 bg-background/70 hover:bg-background truncate"
                        onClick={() => router.push(`/workflows/${workflow.id}`)}
                      >
                        {workflow.name} · {workflow.status}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => router.push(`/workflows?incidentId=${incidentId}`)}
                  >
                    View All Workflows
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="text-2xl font-semibold">{incident.tasks?.length || 0}</p>
                  <div className="space-y-1">
                    {(incident.tasks || []).slice(0, 4).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="block w-full text-left text-xs rounded-lg px-2 py-1 bg-background/70 hover:bg-background truncate"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        {task.title} · {task.status}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => router.push(`/tasks?incidentId=${incidentId}`)}
                  >
                    View All Tasks
                  </Button>
                </div>
                {openWorkflowTaskCount > 0 ? (
                  <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                    Resolve transition is blocked until all correlated workflow tasks are completed. Remaining open workflow tasks: {openWorkflowTaskCount}.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Incident Info */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  Incident Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Reporter</p>
                    <p className="font-medium">
                      {incident.reporter?.firstName} {incident.reporter?.lastName}
                    </p>
                  </div>
                </div>
                {incident.assignee && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Assignee</p>
                      <p className="font-medium">
                        {incident.assignee.firstName} {incident.assignee.lastName}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(incident.dueAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Resolved At</p>
                    <p className="font-medium">{formatDate(incident.resolvedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {incident.tags && incident.tags.length > 0 && (
              <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {incident.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "500ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/workflows?incidentId=${incidentId}`)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Workflows
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/tasks?incidentId=${incidentId}`)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  View Tasks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Incident not found</p>
            <p className="text-muted-foreground mt-1">
              The incident you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => router.push("/incidents")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Incidents
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={transitionDialogOpen} onClose={() => setTransitionDialogOpen(false)} title="Transition Incident">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Select
            label="Target Status"
            value={transitionForm.toStatus}
            onChange={(event) =>
              setTransitionForm((current) => ({ ...current, toStatus: event.target.value }))
            }
            options={STATUS_TRANSITIONS}
          />
          {transitionForm.toStatus === "pending" ? (
            <>
              <Textarea
                label="Pending Reason"
                value={transitionForm.pendingReason}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, pendingReason: event.target.value }))
                }
              />
              <input
                type="datetime-local"
                value={transitionForm.onHoldUntil}
                onChange={(event) =>
                  setTransitionForm((current) => ({ ...current, onHoldUntil: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </>
          ) : null}
          {transitionForm.toStatus === "resolved" ? (
            <Textarea
              label="Resolution Summary"
              value={transitionForm.resolutionSummary}
              onChange={(event) =>
                setTransitionForm((current) => ({ ...current, resolutionSummary: event.target.value }))
              }
            />
          ) : null}
          {transitionForm.toStatus === "closed" ? (
            <Textarea
              label="Closure Code"
              value={transitionForm.closureCode}
              onChange={(event) =>
                setTransitionForm((current) => ({ ...current, closureCode: event.target.value }))
              }
              placeholder="solved, duplicate, not_reproducible"
            />
          ) : null}
          {transitionForm.toStatus === "cancelled" ? (
            <Textarea
              label="Cancellation Reason"
              value={transitionForm.reason}
              onChange={(event) =>
                setTransitionForm((current) => ({ ...current, reason: event.target.value }))
              }
            />
          ) : null}
          <Textarea
            label="Comment (optional)"
            value={transitionForm.comment}
            onChange={(event) =>
              setTransitionForm((current) => ({ ...current, comment: event.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTransitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={submitTransition} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Applying..." : "Apply Transition"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
