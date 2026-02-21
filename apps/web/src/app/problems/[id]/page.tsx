"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  Wrench,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TicketNumberBadge } from "@/components/ui/ticket-badge";
import { PriorityBadge, ImpactUrgencyBadge } from "@/components/ui/priority-matrix";

interface ProblemDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  impact: string;
  urgency: string;
  isKnownError: boolean;
  rootCause?: string;
  workaround?: string;
  impactAssessment?: string;
  createdAt: string;
  detectedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  team?: { id: string; name: string };
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

async function fetchProblem(token: string, id: string): Promise<ProblemDetail> {
  const res = await fetch(`${API_URL}/problems/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch problem");
  return res.json();
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  new: { color: "bg-blue-500/10 text-blue-600", icon: AlertCircle, label: "New" },
  investigating: { color: "bg-purple-500/10 text-purple-600", icon: Wrench, label: "Investigating" },
  root_cause_identified: { color: "bg-amber-500/10 text-amber-600", icon: CheckCircle, label: "Root Cause Identified" },
  known_error: { color: "bg-orange-500/10 text-orange-600", icon: AlertCircle, label: "Known Error" },
  resolved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle, label: "Resolved" },
  closed: { color: "bg-gray-500/10 text-gray-600", icon: XCircle, label: "Closed" },
};

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const problemId = params["id"] as string;

  const { data: problem, isLoading } = useQuery({
    queryKey: ["problem", problemId],
    queryFn: () => fetchProblem(token!, problemId),
    enabled: isAuthenticated && !!token && !!problemId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Problem not found</p>
      </div>
    );
  }

  const statusStyle = statusConfig[problem.status] || statusConfig["new"];
  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Title and Status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TicketNumberBadge ticketNumber={problem.ticketNumber} />
            {problem.isKnownError && (
              <Badge variant="warning">Known Error</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{problem.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusStyle.color}`}>
              <StatusIcon className="h-4 w-4 inline mr-1" />
              {statusStyle.label}
            </span>
            <PriorityBadge priority={problem.priority} />
            <ImpactUrgencyBadge impact={problem.impact} urgency={problem.urgency} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="gradient">Update Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{problem.description}</p>
            </CardContent>
          </Card>

          {/* Root Cause Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Root Cause Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {problem.rootCause ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Root Cause</h4>
                    <p className="text-foreground bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                      {problem.rootCause}
                    </p>
                  </div>
                  {problem.workaround && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Workaround</h4>
                      <p className="text-foreground bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">
                        {problem.workaround}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No root cause analysis yet</p>
                  <Button variant="outline" className="mt-4">Add RCA</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Incidents */}
          {problem.incidents && problem.incidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Incidents ({problem.incidents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {problem.incidents.map((incident) => (
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

          {/* Tasks */}
          {problem.tasks && problem.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks ({problem.tasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {problem.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.assignee && (
                          <p className="text-sm text-muted-foreground">
                            Assigned to: {task.assignee.firstName} {task.assignee.lastName}
                          </p>
                        )}
                      </div>
                      <Badge>{task.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Created</span>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(problem.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Detected At</span>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {new Date(problem.detectedAt).toLocaleString()}
                </p>
              </div>
              {problem.resolvedAt && (
                <div>
                  <span className="text-sm text-muted-foreground">Resolved At</span>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {new Date(problem.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {problem.assignee && (
                <div>
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {problem.assignee.firstName} {problem.assignee.lastName}
                  </p>
                </div>
              )}
              {problem.team && (
                <div>
                  <span className="text-sm text-muted-foreground">Team</span>
                  <p className="font-medium mt-1">{problem.team.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="h-4 w-4 mr-2" />
                Link Incident
              </Button>
              {!problem.isKnownError && (
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mark as Known Error
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
