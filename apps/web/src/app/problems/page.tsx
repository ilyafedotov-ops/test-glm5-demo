"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RecordPicker, type RecordPickerOption } from "@/components/ui/record-picker";
import { TicketNumberBadge } from "@/components/ui/ticket-badge";
import {
  PriorityBadge,
  ImpactUrgencyBadge,
  PriorityMatrixSelector,
} from "@/components/ui/priority-matrix";

interface Problem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  impact: string;
  urgency: string;
  isKnownError: boolean;
  createdAt: string;
  detectedAt: string;
  resolvedAt?: string;
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  team?: { id: string; name: string };
  _count?: { incidents: number; tasks: number };
}

interface ProblemsResponse {
  data: Problem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function fetchProblems(
  token: string,
  filters?: { isKnownError?: boolean }
): Promise<ProblemsResponse> {
  const params = new URLSearchParams();
  if (filters?.isKnownError === true) params.set("isKnownError", "true");
  const query = params.toString();
  const res = await fetch(`${API_URL}/problems${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch problems");
  return res.json();
}

interface ProblemOptions {
  incidents: Array<{ id: string; ticketNumber: string | null; title: string; status: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  teams: Array<{ id: string; name: string }>;
}

async function fetchProblemOptions(token: string): Promise<ProblemOptions> {
  const res = await fetch(`${API_URL}/problems/options`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch problem options");
  return res.json();
}

async function fetchProblemIncidentOptions(
  token: string,
  query: string
): Promise<RecordPickerOption[]> {
  const params = new URLSearchParams({ limit: "20" });
  if (query.trim()) {
    params.set("q", query.trim());
  }

  const res = await fetch(`${API_URL}/problems/options/incidents?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch incident options");
  return res.json();
}

async function createProblem(
  token: string,
  payload: {
    title: string;
    description: string;
    priority?: string;
    impact?: string;
    urgency?: string;
    assigneeId?: string;
    teamId?: string;
    incidentIds?: string[];
    isKnownError?: boolean;
    workaround?: string;
    rootCause?: string;
  }
) {
  const res = await fetch(`${API_URL}/problems`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create problem");
  }
  return res.json();
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  new: { color: "bg-blue-500/10 text-blue-600", icon: AlertCircle, label: "New" },
  investigating: {
    color: "bg-purple-500/10 text-purple-600",
    icon: Wrench,
    label: "Investigating",
  },
  root_cause_identified: {
    color: "bg-amber-500/10 text-amber-600",
    icon: CheckCircle,
    label: "Root Cause Identified",
  },
  known_error: {
    color: "bg-orange-500/10 text-orange-600",
    icon: AlertCircle,
    label: "Known Error",
  },
  resolved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle, label: "Resolved" },
  closed: { color: "bg-gray-500/10 text-gray-600", icon: XCircle, label: "Closed" },
};

type ImpactUrgency = "critical" | "high" | "medium" | "low";

const INITIAL_FORM = {
  title: "",
  description: "",
  impact: "medium" as ImpactUrgency,
  urgency: "medium" as ImpactUrgency,
  priority: "medium",
  assigneeId: "",
  teamId: "",
  incidentIds: [] as string[],
  isKnownError: false,
  workaround: "",
  rootCause: "",
};

export default function ProblemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [kedbFilter, setKedbFilter] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [incidentOptionCache, setIncidentOptionCache] = useState<
    Record<string, RecordPickerOption>
  >({});

  const loadProblemIncidentOptions = useCallback(
    async (query: string) => (token ? fetchProblemIncidentOptions(token, query) : []),
    [token]
  );

  const rememberIncidentOption = useCallback((option: RecordPickerOption) => {
    setIncidentOptionCache((current) => ({ ...current, [option.id]: option }));
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setDialogOpen(true);
      router.replace("/problems", { scroll: false });
    }
  }, [searchParams, router]);

  const { data: options } = useQuery({
    queryKey: ["problems", "options"],
    queryFn: () => fetchProblemOptions(token!),
    enabled: isAuthenticated && !!token && dialogOpen,
  });

  useEffect(() => {
    if (!options?.incidents) return;
    setIncidentOptionCache((current) => {
      const next = { ...current };
      for (const incident of options.incidents) {
        next[incident.id] = {
          id: incident.id,
          label: `${incident.ticketNumber || incident.id.slice(0, 8).toUpperCase()} · ${incident.title}`,
          subtitle: `Status: ${incident.status}`,
          status: incident.status,
        };
      }
      return next;
    });
  }, [options?.incidents]);

  const createMutation = useMutation({
    mutationFn: () =>
      createProblem(token!, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        impact: formData.impact,
        urgency: formData.urgency,
        assigneeId: formData.assigneeId || undefined,
        teamId: formData.teamId || undefined,
        incidentIds: formData.incidentIds.length > 0 ? formData.incidentIds : undefined,
        isKnownError: formData.isKnownError,
        workaround: formData.workaround || undefined,
        rootCause: formData.rootCause || undefined,
      }),
    onSuccess: (problem) => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      closeCreateDialog();
      addToast({
        type: "success",
        title: "Problem created",
        description: `Problem ${problem.ticketNumber} has been created.`,
      });
      router.push(`/problems/${problem.id}`);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Failed to create problem");
      addToast({
        type: "error",
        title: "Create failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError("Title and description are required");
      return;
    }
    setFormError("");
    createMutation.mutate();
  };

  function closeCreateDialog() {
    setDialogOpen(false);
    setFormData(INITIAL_FORM);
    setFormError("");
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["problems", kedbFilter],
    queryFn: () => fetchProblems(token!, { isKnownError: kedbFilter || undefined }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const filteredProblems =
    data?.data?.filter(
      (problem) =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const selectedIncidentOptions = formData.incidentIds.map((id) => {
    return (
      incidentOptionCache[id] || {
        id,
        label: id.slice(0, 8).toUpperCase(),
      }
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Problem Management</h1>
          <p className="text-muted-foreground mt-1">
            Identify and resolve root causes of incidents
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Create Problem
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <p className="text-3xl font-bold">{data?.pagination?.total || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-3xl font-bold">
                  {filteredProblems.filter((p) => p.status === "investigating").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Known Errors</p>
                <p className="text-3xl font-bold">
                  {filteredProblems.filter((p) => p.isKnownError).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold">
                  {
                    filteredProblems.filter((p) => p.status === "resolved" || p.status === "closed")
                      .length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problems List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Problems</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={kedbFilter}
                  onChange={(e) => setKedbFilter(e.target.checked)}
                  className="rounded border-input"
                />
                Known Error Database (KEDB)
              </label>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading problems...</p>
            </div>
          ) : filteredProblems.length > 0 ? (
            <div className="space-y-3">
              {filteredProblems.map((problem) => {
                const statusStyle = statusConfig[problem.status] || statusConfig["new"];
                const StatusIcon = statusStyle.icon;

                return (
                  <div
                    key={problem.id}
                    onClick={() => router.push(`/problems/${problem.id}`)}
                    className="group flex items-center justify-between p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <TicketNumberBadge ticketNumber={problem.ticketNumber} compact />
                        <h3 className="font-semibold truncate">{problem.title}</h3>
                        {problem.isKnownError && (
                          <Badge variant="warning" className="text-xs">
                            Known Error
                          </Badge>
                        )}
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${statusStyle.color}`}
                        >
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                        {problem.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                        <ImpactUrgencyBadge impact={problem.impact} urgency={problem.urgency} />
                        {problem._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {problem._count.incidents} incidents
                            </span>
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {problem._count.tasks} tasks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <PriorityBadge priority={problem.priority} />
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-lg font-medium">No problems found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first problem to start root cause analysis
              </p>
              <Button variant="gradient" className="mt-6" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Problem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Problem Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeCreateDialog}
        title="Create New Problem"
        size="form"
        mobileMode="fullscreen"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeCreateDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-problem-form"
              variant="gradient"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Problem"}
            </Button>
          </div>
        }
      >
        <form id="create-problem-form" onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">Core Details</h3>
            <Input
              label="Title"
              placeholder="Brief description of the problem"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />

            <Textarea
              label="Description"
              placeholder="Detailed description of the problem and symptoms"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />

            <PriorityMatrixSelector
              impact={formData.impact}
              urgency={formData.urgency}
              onImpactChange={(impact) =>
                setFormData((prev) => ({ ...prev, impact: impact as ImpactUrgency }))
              }
              onUrgencyChange={(urgency) =>
                setFormData((prev) => ({ ...prev, urgency: urgency as ImpactUrgency }))
              }
              onPriorityChange={(priority) => setFormData((prev) => ({ ...prev, priority }))}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Ownership and Linked Incidents
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Assignee"
                value={formData.assigneeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigneeId: e.target.value }))}
                options={[
                  { value: "", label: "Unassigned" },
                  ...(options?.users?.map((u) => ({
                    value: u.id,
                    label: `${u.firstName} ${u.lastName}`,
                  })) ?? []),
                ]}
              />
              <Select
                label="Team"
                value={formData.teamId}
                onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value }))}
                options={[
                  { value: "", label: "No team" },
                  ...(options?.teams?.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })) ?? []),
                ]}
              />
            </div>

            <RecordPicker
              label="Add Linked Incident (optional)"
              placeholder="Search incidents by ticket, title, or id"
              loadOptions={loadProblemIncidentOptions}
              onSelect={(option) => {
                rememberIncidentOption(option);
                setFormData((prev) =>
                  prev.incidentIds.includes(option.id)
                    ? prev
                    : { ...prev, incidentIds: [...prev.incidentIds, option.id] }
                );
              }}
            />

            {selectedIncidentOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedIncidentOptions.map((incident) => (
                  <button
                    key={incident.id}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        incidentIds: prev.incidentIds.filter((id) => id !== incident.id),
                      }))
                    }
                  >
                    {incident.label}
                    <span className="text-muted-foreground">x</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No linked incidents selected.</p>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">Known Error and Analysis</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isKnownError}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isKnownError: e.target.checked }))
                }
                className="rounded border-input"
              />
              Known Error (identified cause, workaround available)
            </label>

            {formData.isKnownError ? (
              <Textarea
                label="Workaround"
                placeholder="Temporary workaround for users while root cause is being fixed"
                value={formData.workaround}
                onChange={(e) => setFormData((prev) => ({ ...prev, workaround: e.target.value }))}
                rows={2}
                required
              />
            ) : null}

            <Textarea
              label="Root Cause (optional)"
              placeholder="Identified or suspected root cause"
              value={formData.rootCause}
              onChange={(e) => setFormData((prev) => ({ ...prev, rootCause: e.target.value }))}
              rows={2}
            />
          </section>
        </form>
      </Dialog>
    </div>
  );
}
