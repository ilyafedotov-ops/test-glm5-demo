"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Play,
  Plus,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { TicketNumberBadge } from "@/components/ui/ticket-badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface ChangeDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  reason: string;
  type: string;
  status: string;
  riskLevel: string;
  impactLevel: string;
  rollbackPlan?: string;
  testPlan?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  createdAt: string;
  pirStatus?: string;
  pirSummary?: string;
  pirOutcome?: string;
  pirCompletedAt?: string;
  requester: { id: string; firstName: string; lastName: string; email: string };
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  pirReviewedBy?: { id: string; firstName: string; lastName: string; email: string };
  team?: { id: string; name: string };
  approvals?: Array<{
    id: string;
    status: string;
    comments?: string;
    approvedAt?: string;
    approver: { id: string; firstName: string; lastName: string; email: string };
  }>;
  incidents?: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    assignee?: { id: string; firstName: string; lastName: string };
  }>;
}

async function fetchChange(token: string, id: string): Promise<ChangeDetail> {
  const res = await fetch(`${API_URL}/changes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch change");
  return res.json();
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "bg-gray-500/10 text-gray-600", icon: FileText, label: "Draft" },
  requested: { color: "bg-blue-500/10 text-blue-600", icon: Clock, label: "Requested" },
  assessing: { color: "bg-purple-500/10 text-purple-600", icon: AlertTriangle, label: "Assessing" },
  scheduled: { color: "bg-cyan-500/10 text-cyan-600", icon: Calendar, label: "Scheduled" },
  approved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle, label: "Approved" },
  rejected: { color: "bg-rose-500/10 text-rose-600", icon: XCircle, label: "Rejected" },
  implementing: { color: "bg-orange-500/10 text-orange-600", icon: Play, label: "Implementing" },
  completed: { color: "bg-green-500/10 text-green-600", icon: CheckCircle, label: "Completed" },
  failed: { color: "bg-red-500/10 text-red-600", icon: XCircle, label: "Failed" },
};

const typeConfig: Record<string, { color: string; label: string }> = {
  standard: { color: "bg-blue-500/10 text-blue-600", label: "Standard" },
  normal: { color: "bg-purple-500/10 text-purple-600", label: "Normal" },
  emergency: { color: "bg-red-500/10 text-red-600", label: "Emergency" },
};

const riskConfig: Record<string, { color: string; label: string }> = {
  low: { color: "text-emerald-600", label: "Low" },
  medium: { color: "text-amber-600", label: "Medium" },
  high: { color: "text-orange-600", label: "High" },
  critical: { color: "text-red-600", label: "Critical" },
};

const actionLabel: Record<string, string> = {
  submit: "Submit for Approval",
  approve: "Approve",
  reject: "Reject",
  implement: "Start Implementation",
  complete: "Mark Complete",
};

export default function ChangeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [pirDialogOpen, setPirDialogOpen] = useState(false);
  const [pirForm, setPirForm] = useState({
    pirSummary: "",
    pirOutcome: "successful",
  });

  const changeId = params["id"] as string;
  const queryKey = useMemo(() => ["change", changeId], [changeId]);

  const { data: change, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchChange(token!, changeId),
    enabled: isAuthenticated && !!token && !!changeId,
    retry: false,
  });

  const lifecycleMutation = useMutation({
    mutationFn: async ({ action, body }: { action: "submit" | "approve" | "reject" | "implement" | "complete"; body?: any }) => {
      const res = await fetch(`${API_URL}/changes/${changeId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body || {}),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || `Failed to ${action}`);
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      addToast({
        type: "success",
        title: "Change updated",
        description: `${actionLabel[variables.action]} succeeded.`,
      });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Action failed", description: error.message });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`${API_URL}/changes/${changeId}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || "Failed to add task");
      }

      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Task added", description: "Task linked to change request." });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => addToast({ type: "error", title: "Add task failed", description: error.message }),
  });

  const runApprove = () => {
    const comments = window.prompt("Approval comments (optional):") || undefined;
    lifecycleMutation.mutate({ action: "approve", body: { comments } });
  };

  const runReject = () => {
    const reason = window.prompt("Rejection reason (required):");
    if (!reason?.trim()) return;
    lifecycleMutation.mutate({ action: "reject", body: { reason } });
  };

  const runAddTask = () => {
    const title = window.prompt("Task title:");
    if (!title?.trim()) return;
    addTaskMutation.mutate(title.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!change) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Change request not found</p>
      </div>
    );
  }

  const statusStyle = statusConfig[change.status] || statusConfig["draft"];
  const typeStyle = typeConfig[change.type] || typeConfig["normal"];
  const riskStyle = riskConfig[change.riskLevel] || riskConfig["medium"];
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TicketNumberBadge ticketNumber={change.ticketNumber} />
            <Badge className={typeStyle.color}>{typeStyle.label}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{change.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusStyle.color}`}>
              <StatusIcon className="h-4 w-4 inline mr-1" />
              {statusStyle.label}
            </span>
            <span className={`text-sm font-medium ${riskStyle.color}`}>Risk: {riskStyle.label}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {change.status === "draft" && (
            <Button
              variant="gradient"
              onClick={() => lifecycleMutation.mutate({ action: "submit" })}
              disabled={lifecycleMutation.isPending}
            >
              Submit for Approval
            </Button>
          )}
          {change.status === "requested" && (
            <>
              <Button variant="gradient" onClick={runApprove} disabled={lifecycleMutation.isPending}>
                Approve
              </Button>
              <Button variant="outline" className="text-red-600" onClick={runReject} disabled={lifecycleMutation.isPending}>
                Reject
              </Button>
            </>
          )}
          {change.status === "approved" && (
            <Button
              variant="gradient"
              onClick={() => lifecycleMutation.mutate({ action: "implement" })}
              disabled={lifecycleMutation.isPending}
            >
              Start Implementation
            </Button>
          )}
          {change.status === "implementing" && (
            <Button
              variant="gradient"
              onClick={() => setPirDialogOpen(true)}
              disabled={lifecycleMutation.isPending}
            >
              Mark Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/changes")}>Back to Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Justification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Reason for Change</h4>
                <p className="text-foreground bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">{change.reason}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-foreground whitespace-pre-wrap">{change.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post-Implementation Review (PIR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">PIR Status</div>
                  <div className="mt-1 font-medium">
                    {change.pirStatus ? change.pirStatus.replace(/_/g, " ") : "not started"}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Outcome</div>
                  <div className="mt-1 font-medium">{change.pirOutcome || "n/a"}</div>
                </div>
              </div>
              {change.pirSummary ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Summary</div>
                  <p className="text-sm whitespace-pre-wrap">{change.pirSummary}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No PIR summary recorded yet.</div>
              )}
              {change.pirCompletedAt ? (
                <div className="text-xs text-muted-foreground">
                  Completed {new Date(change.pirCompletedAt).toLocaleString()}
                  {change.pirReviewedBy
                    ? ` by ${change.pirReviewedBy.firstName} ${change.pirReviewedBy.lastName}`
                    : ""}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <p className={`text-lg font-semibold mt-1 ${riskStyle.color}`}>{riskStyle.label}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Impact Level</span>
                  <p className="text-lg font-semibold mt-1">
                    {change.impactLevel.charAt(0).toUpperCase() + change.impactLevel.slice(1)}
                  </p>
                </div>
              </div>

              {change.testPlan && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Test Plan</h4>
                  <p className="text-foreground bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20 whitespace-pre-wrap">
                    {change.testPlan}
                  </p>
                </div>
              )}

              {change.rollbackPlan && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Rollback Plan</h4>
                  <p className="text-foreground bg-red-500/5 p-4 rounded-lg border border-red-500/20 whitespace-pre-wrap">
                    {change.rollbackPlan}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {change.approvals && change.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Approvals ({change.approvals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {change.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">
                          {approval.approver.firstName} {approval.approver.lastName}
                        </p>
                        {approval.comments && (
                          <p className="text-sm text-muted-foreground">{approval.comments}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          approval.status === "approved"
                            ? "success"
                            : approval.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {approval.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {change.incidents && change.incidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Incidents ({change.incidents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {change.incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push(`/incidents/${incident.id}`)}
                    >
                      <div>
                        <span className="font-mono text-sm text-violet-600">{incident.ticketNumber}</span>
                        <p className="font-medium">{incident.title}</p>
                      </div>
                      <Badge>{incident.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Created</span>
                <p className="font-medium mt-1">{new Date(change.createdAt).toLocaleString()}</p>
              </div>
              {change.plannedStart && (
                <div>
                  <span className="text-sm text-muted-foreground">Planned Start</span>
                  <p className="font-medium mt-1">{new Date(change.plannedStart).toLocaleString()}</p>
                </div>
              )}
              {change.plannedEnd && (
                <div>
                  <span className="text-sm text-muted-foreground">Planned End</span>
                  <p className="font-medium mt-1">{new Date(change.plannedEnd).toLocaleString()}</p>
                </div>
              )}
              {change.actualStart && (
                <div>
                  <span className="text-sm text-muted-foreground">Actual Start</span>
                  <p className="font-medium mt-1">{new Date(change.actualStart).toLocaleString()}</p>
                </div>
              )}
              {change.actualEnd && (
                <div>
                  <span className="text-sm text-muted-foreground">Actual End</span>
                  <p className="font-medium mt-1">{new Date(change.actualEnd).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Requester</span>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  {change.requester.firstName} {change.requester.lastName}
                </p>
              </div>
              {change.assignee && (
                <div>
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {change.assignee.firstName} {change.assignee.lastName}
                  </p>
                </div>
              )}
              {change.team && (
                <div>
                  <span className="text-sm text-muted-foreground">Team</span>
                  <p className="font-medium mt-1">{change.team.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={runAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/changes") }>
                <FileText className="h-4 w-4 mr-2" />
                View All Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={pirDialogOpen} onClose={() => setPirDialogOpen(false)} title="Complete Change with PIR">
        <div className="space-y-4">
          <Textarea
            label="PIR Summary"
            value={pirForm.pirSummary}
            onChange={(event) =>
              setPirForm((current) => ({ ...current, pirSummary: event.target.value }))
            }
            placeholder="Document outcome, verification results, and lessons learned."
          />
          <Select
            label="PIR Outcome"
            value={pirForm.pirOutcome}
            onChange={(event) =>
              setPirForm((current) => ({ ...current, pirOutcome: event.target.value }))
            }
            options={[
              { value: "successful", label: "Successful" },
              { value: "partial", label: "Partially Successful" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPirDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={lifecycleMutation.isPending}
              onClick={() => {
                if (!pirForm.pirSummary.trim()) {
                  addToast({
                    type: "error",
                    title: "PIR summary is required",
                  });
                  return;
                }
                lifecycleMutation.mutate(
                  {
                    action: "complete",
                    body: {
                      pirSummary: pirForm.pirSummary.trim(),
                      pirOutcome: pirForm.pirOutcome,
                    },
                  },
                  {
                    onSuccess: () => {
                      setPirDialogOpen(false);
                    },
                  }
                );
              }}
            >
              {lifecycleMutation.isPending ? "Completing..." : "Complete Change"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
