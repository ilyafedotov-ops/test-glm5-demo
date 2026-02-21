"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  AlertCircle,
  User,
  Calendar,
  CheckCircle,
  Shield,
  ChevronRight,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ViolationDetail {
  id: string;
  policyId: string;
  entityId: string;
  entityType: string;
  status: string;
  severity: string;
  title: string;
  description?: string;
  remediation?: string;
  acknowledgedAt?: string;
  remediatedAt?: string;
  assigneeId?: string;
  assigneeName?: string;
  policyName?: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchViolation(token: string, id: string): Promise<ViolationDetail> {
  const res = await fetch(`${API_URL}/violations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch violation");
  return res.json();
}

async function acknowledgeViolation(token: string, id: string, notes: string) {
  const res = await fetch(`${API_URL}/violations/${id}/acknowledge`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment: notes || undefined }),
  });
  if (!res.ok) throw new Error("Failed to acknowledge violation");
  return res.json();
}

async function remediateViolation(token: string, id: string, notes: string) {
  const res = await fetch(`${API_URL}/violations/${id}/remediate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ remediation: notes }),
  });
  if (!res.ok) throw new Error("Failed to remediate violation");
  return res.json();
}

async function assignViolation(token: string, id: string, userId: string) {
  const res = await fetch(`${API_URL}/violations/${id}/assign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeId: userId }),
  });
  if (!res.ok) throw new Error("Failed to assign violation");
  return res.json();
}

export default function ViolationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");

  const violationId = params["id"] as string;

  const { data: violation, isLoading } = useQuery({
    queryKey: ["violation", violationId],
    queryFn: () => fetchViolation(token!, violationId),
    enabled: isAuthenticated && !!token && !!violationId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => acknowledgeViolation(token!, violationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation", violationId] });
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      setNotes("");
    },
  });

  const remediateMutation = useMutation({
    mutationFn: () => remediateViolation(token!, violationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation", violationId] });
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      setNotes("");
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => assignViolation(token!, violationId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation", violationId] });
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      setAssignDialogOpen(false);
      setAssigneeId("");
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
      case "open":
        return "bg-rose-500";
      case "acknowledged":
        return "bg-amber-500";
      case "remediated":
        return "bg-emerald-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
          onClick={() => router.push("/violations")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? "Loading..." : violation?.title || "Violation Details"}
            </h1>
            {violation && (
              <Badge className={`${getStatusColor(violation.status)} text-white border-0`}>
                {violation.status}
              </Badge>
            )}
            {violation && (
              <Badge className={`${getSeverityColor(violation.severity)} text-white border-0`}>
                {violation.severity}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {violation?.entityType} - Created {violation ? formatDate(violation.createdAt) : ""}
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
      ) : violation ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {violation.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Remediation */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  Remediation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {violation.remediation ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {violation.remediation}
                  </p>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No remediation notes yet
                  </p>
                )}

                {violation.status !== "remediated" && violation.status !== "closed" && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Add remediation notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      {violation.status === "open" && (
                        <Button
                          variant="outline"
                          onClick={() => acknowledgeMutation.mutate()}
                          disabled={acknowledgeMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="gradient"
                        onClick={() => remediateMutation.mutate()}
                        disabled={remediateMutation.isPending || !notes.trim()}
                      >
                        Mark as Remediated
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Policy */}
            {violation.policyName && (
              <Card
                variant="glass"
                className="animate-slide-up cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
                style={{ animationDelay: "200ms" }}
                onClick={() => router.push(`/compliance/${violation.policyId}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                      <Shield className="h-5 w-5 text-violet-500" />
                    </div>
                    Related Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{violation.policyName}</p>
                      <p className="text-sm text-muted-foreground">Policy {violation.policyId}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Violation Info */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Entity</p>
                    <p className="font-medium">{violation.entityType} ({violation.entityId})</p>
                  </div>
                </div>
                {violation.assigneeName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Assignee</p>
                      <p className="font-medium">{violation.assigneeName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(violation.createdAt)}</p>
                  </div>
                </div>
                {violation.acknowledgedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Acknowledged</p>
                      <p className="font-medium">{formatDate(violation.acknowledgedAt)}</p>
                    </div>
                  </div>
                )}
                {violation.remediatedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-muted-foreground">Remediated</p>
                      <p className="font-medium">{formatDate(violation.remediatedAt)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!violation.assigneeId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Assign to User
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/compliance/${violation.policyId}`)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Violation not found</p>
            <p className="text-muted-foreground mt-1">
              The violation you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => router.push("/violations")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Violations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assign Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        title="Assign Violation"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the user ID to assign this violation to.
          </p>
          <Input
            label="User ID"
            placeholder="Enter user ID"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => assignMutation.mutate()}
              disabled={!assigneeId.trim() || assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
