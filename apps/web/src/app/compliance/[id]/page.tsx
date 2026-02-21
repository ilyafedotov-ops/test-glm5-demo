"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PolicyDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  version: string;
  reviewFrequencyDays: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  effectiveFrom: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  ownerRoleId: string;
  violations?: Violation[];
  exceptions?: PolicyException[];
}

interface Violation {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface PolicyException {
  id: string;
  title: string;
  justification: string;
  status: string;
  requestedAt: string;
  approvedAt?: string | null;
  expiresAt?: string | null;
  requestedBy?: { id: string; firstName: string; lastName: string; email: string };
  approvedBy?: { id: string; firstName: string; lastName: string; email: string };
}

async function fetchPolicy(token: string, id: string): Promise<PolicyDetail> {
  const res = await fetch(`${API_URL}/policies/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch policy");
  return res.json();
}

async function updatePolicy(
  token: string,
  id: string,
  data: {
    name: string;
    description: string;
    category: string;
    status: string;
    version?: string;
    effectiveFrom?: string;
  }
) {
  const res = await fetch(`${API_URL}/policies/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update policy");
  return res.json();
}

async function createPolicyException(
  token: string,
  policyId: string,
  data: { title: string; justification: string; expiresAt?: string }
) {
  const res = await fetch(`${API_URL}/policies/${policyId}/exceptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create policy exception");
  return res.json();
}

async function reviewPolicyException(
  token: string,
  policyId: string,
  exceptionId: string,
  action: "approve" | "reject",
  note?: string
) {
  const res = await fetch(`${API_URL}/policies/${policyId}/exceptions/${exceptionId}/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) throw new Error(`Failed to ${action} exception`);
  return res.json();
}

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [exceptionForm, setExceptionForm] = useState({
    title: "",
    justification: "",
    expiresAt: "",
  });

  const policyId = params["id"] as string;

  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: () => fetchPolicy(token!, policyId),
    enabled: isAuthenticated && !!token && !!policyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      category: string;
      status: string;
      version?: string;
      effectiveFrom?: string;
    }) =>
      updatePolicy(token!, policyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", policyId] });
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setEditDialogOpen(false);
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update policy");
    },
  });

  const createExceptionMutation = useMutation({
    mutationFn: () =>
      createPolicyException(token!, policyId, {
        title: exceptionForm.title,
        justification: exceptionForm.justification,
        expiresAt: exceptionForm.expiresAt || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", policyId] });
      setExceptionDialogOpen(false);
      setExceptionForm({ title: "", justification: "", expiresAt: "" });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create exception");
    },
  });

  const reviewExceptionMutation = useMutation({
    mutationFn: ({
      exceptionId,
      action,
      note,
    }: {
      exceptionId: string;
      action: "approve" | "reject";
      note?: string;
    }) => reviewPolicyException(token!, policyId, exceptionId, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", policyId] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to review exception");
    },
  });

  if (!isAuthenticated) return null;

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "draft":
        return "bg-slate-500";
      case "archived":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500";
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
          onClick={() => router.push("/compliance")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? "Loading..." : policy?.name || "Policy Details"}
            </h1>
            {policy && (
              <Badge className={`${getStatusColor(policy.status)} text-white border-0`}>
                {policy.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {policy?.category || "Policy"} - Version {policy?.version || "1.0"}
          </p>
        </div>
        {policy && (
          <Button variant="gradient" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit Policy
          </Button>
        )}
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
      ) : policy ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <FileText className="h-5 w-5 text-violet-500" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {policy.description}
                </p>
              </CardContent>
            </Card>

            {/* Related Violations */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                  </div>
                  Related Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {policy.violations && policy.violations.length > 0 ? (
                  <div className="space-y-3">
                    {policy.violations.map((violation) => (
                      <div
                        key={violation.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                        onClick={() => router.push(`/violations?id=${violation.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium">{violation.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(violation.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getSeverityColor(violation.severity)} text-white border-0 text-xs`}>
                            {violation.severity}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No violations associated with this policy</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "150ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  <span className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    Policy Exceptions
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setExceptionDialogOpen(true)}>
                    Request Exception
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {policy.exceptions && policy.exceptions.length > 0 ? (
                  <div className="space-y-3">
                    {policy.exceptions.map((exception) => (
                      <div key={exception.id} className="rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{exception.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {exception.justification}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Requested {formatDate(exception.requestedAt)}
                              {exception.requestedBy
                                ? ` by ${exception.requestedBy.firstName} ${exception.requestedBy.lastName}`
                                : ""}
                              {exception.expiresAt
                                ? ` · Expires ${formatDate(exception.expiresAt)}`
                                : ""}
                            </p>
                          </div>
                          <Badge className="text-white border-0 bg-slate-500">
                            {exception.status}
                          </Badge>
                        </div>
                        {exception.status === "requested" ? (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={() => {
                                const note = window.prompt("Approval note (optional):") || undefined;
                                reviewExceptionMutation.mutate({
                                  exceptionId: exception.id,
                                  action: "approve",
                                  note,
                                });
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600"
                              onClick={() => {
                                const note = window.prompt("Rejection reason:");
                                if (!note?.trim()) return;
                                reviewExceptionMutation.mutate({
                                  exceptionId: exception.id,
                                  action: "reject",
                                  note: note.trim(),
                                });
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No policy exceptions requested for this policy.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Policy Info */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  Policy Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{policy.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Review Frequency</p>
                    <p className="font-medium">Every {policy.reviewFrequencyDays} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Reviewed</p>
                    <p className="font-medium">{formatDate(policy.lastReviewedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Effective From</p>
                    <p className="font-medium">{formatDate(policy.effectiveFrom)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Next Review</p>
                    <p className="font-medium">{formatDate(policy.nextReviewAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(policy.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Policy
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                  onClick={() => {
                    if (confirm("Are you sure you want to archive this policy?")) {
                      updateMutation.mutate({
                        name: policy.name,
                        description: policy.description,
                        category: policy.category,
                        status: "archived",
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Policy not found</p>
            <p className="text-muted-foreground mt-1">
              The policy you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => router.push("/compliance")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Compliance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Policy"
      >
        {policy && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              updateMutation.mutate({
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                category: formData.get("category") as string,
                status: formData.get("status") as string,
                version: (formData.get("version") as string) || undefined,
                effectiveFrom: (formData.get("effectiveFrom") as string) || undefined,
              });
            }}
            className="space-y-5"
          >
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                {error}
              </div>
            )}
            <Input
              label="Policy Name"
              name="name"
              defaultValue={policy.name}
              required
            />
            <Textarea
              label="Description"
              name="description"
              defaultValue={policy.description}
              required
            />
            <Select
              label="Category"
              name="category"
              defaultValue={policy.category}
              options={[
                { value: "Security", label: "Security" },
                { value: "Compliance", label: "Compliance" },
                { value: "Operations", label: "Operations" },
                { value: "HR", label: "HR" },
                { value: "Finance", label: "Finance" },
              ]}
            />
            <Select
              label="Status"
              name="status"
              defaultValue={policy.status}
              options={[
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "deprecated", label: "Deprecated" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <Input
              label="Version"
              name="version"
              defaultValue={policy.version}
            />
            <Input
              label="Effective From"
              name="effectiveFrom"
              type="date"
              defaultValue={policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().split("T")[0] : ""}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={exceptionDialogOpen}
        onClose={() => setExceptionDialogOpen(false)}
        title="Request Policy Exception"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!exceptionForm.title.trim() || !exceptionForm.justification.trim()) {
              setError("Exception title and justification are required");
              return;
            }
            createExceptionMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Exception Title"
            value={exceptionForm.title}
            onChange={(event) =>
              setExceptionForm((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
          <Textarea
            label="Justification"
            value={exceptionForm.justification}
            onChange={(event) =>
              setExceptionForm((current) => ({ ...current, justification: event.target.value }))
            }
            required
          />
          <Input
            label="Expires At (optional)"
            type="datetime-local"
            value={exceptionForm.expiresAt}
            onChange={(event) =>
              setExceptionForm((current) => ({ ...current, expiresAt: event.target.value }))
            }
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setExceptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createExceptionMutation.isPending}>
              {createExceptionMutation.isPending ? "Submitting..." : "Submit Exception"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
