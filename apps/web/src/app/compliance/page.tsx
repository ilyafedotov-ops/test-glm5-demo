"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  Shield,
  Plus,
  FileCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  Filter,
  Search,
  Network,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusMatrix } from "@/components/operations/status-matrix";
import { SystemRecordBadge } from "@/components/operations/system-record-badge";

interface Policy {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "draft" | "active" | "deprecated" | "archived" | string;
  version: string;
  effectiveFrom?: string | null;
  createdAt: string;
}

interface PolicyResponse {
  data: Policy[];
  pagination: { total: number };
}

interface ViolationStats {
  total: number;
  open: number;
  acknowledged: number;
  inRemediation: number;
  remediated: number;
  critical: number;
  high: number;
}

interface CorrelationMap {
  crossDomain: {
    tasks: number;
    workflows: number;
    violations: number;
    auditLogsLast7Days: number;
    linkageCoveragePercent: number;
  };
  recentActivity: Array<{
    id: string;
    systemRecordId: string;
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
  }>;
}

async function fetchPolicies(token: string): Promise<PolicyResponse> {
  const res = await fetch(`${API_URL}/policies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

async function fetchViolationStats(token: string): Promise<ViolationStats> {
  const res = await fetch(`${API_URL}/violations/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch violation stats");
  return res.json();
}

async function fetchCorrelationMap(token: string): Promise<CorrelationMap> {
  const res = await fetch(`${API_URL}/dashboard/correlation-map`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch correlation map");
  return res.json();
}

async function createPolicy(
  token: string,
  data: {
    name: string;
    description: string;
    category: string;
    version?: string;
    status?: string;
    effectiveFrom?: string;
  }
) {
  const res = await fetch(`${API_URL}/policies`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create policy");
  return res.json();
}

const statusOrder = ["draft", "active", "deprecated", "archived"] as const;

export default function CompliancePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Security",
    version: "1.0",
    status: "draft",
    effectiveFrom: "",
  });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => fetchPolicies(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: violationStats } = useQuery({
    queryKey: ["violations", "stats"],
    queryFn: () => fetchViolationStats(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: correlationMap } = useQuery({
    queryKey: ["dashboard", "correlation-map"],
    queryFn: () => fetchCorrelationMap(token!),
    enabled: isAuthenticated && !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => createPolicy(token!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "Security",
        version: "1.0",
        status: "draft",
        effectiveFrom: "",
      });
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Name and description are required");
      return;
    }
    createMutation.mutate();
  };

  if (!isAuthenticated) return null;

  const policies = data?.data || [];
  const activePolicies = policies.filter((p) => p.status === "active").length;

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const statusMatch = statusFilter === "all" || policy.status === statusFilter;
      const searchMatch =
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.category.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [policies, searchTerm, statusFilter]);

  const groupedPolicies = useMemo(() => {
    return statusOrder.map((status) => ({
      status,
      items: filteredPolicies.filter((policy) => policy.status === status),
    }));
  }, [filteredPolicies]);

  const stats = [
    {
      label: "Active Policies",
      value: activePolicies.toString(),
      icon: FileCheck,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Total Policies",
      value: policies.length.toString(),
      icon: FileText,
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      label: "Open Violations",
      value: String(violationStats?.open ?? 0),
      icon: AlertCircle,
      gradient: "from-rose-500 to-red-500",
    },
    {
      label: "Linked Coverage",
      value: `${correlationMap?.crossDomain.linkageCoveragePercent ?? 0}%`,
      icon: Network,
      gradient: "from-violet-500 to-indigo-500",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground mt-2">
            Policy lifecycle, control health, and evidence-linked activity in one workspace
          </p>
        </div>
        <Button variant="gradient" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Policy
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            variant="glass"
            className="group overflow-hidden animate-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardContent className="relative pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusMatrix
          title="Control Matrix"
          items={[
            {
              name: "Policy Activation",
              value: policies.length > 0 ? Math.round((activePolicies / policies.length) * 100) : 0,
              target: 100,
              hint: "Percent of policies that are active",
            },
            {
              name: "Violation Remediation",
              value: violationStats?.remediated ?? 0,
              target: violationStats?.total || 1,
              hint: "Remediated violations out of total",
            },
            {
              name: "Cross-domain Linkage",
              value: correlationMap?.crossDomain.linkageCoveragePercent ?? 0,
              target: 100,
              hint: "Tasks with linked workflow/incident/compliance context",
            },
          ]}
        />

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-cyan-500" />
              Policy Explorer
            </CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by policy, category, description..."
                  className="w-full rounded-xl border border-border/70 bg-background px-10 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "deprecated", label: "Deprecated" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPolicies.map((group) => (
                <div key={group.status} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold capitalize">{group.status.replace("_", " ")}</div>
                    <Badge variant="secondary">{group.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.items.slice(0, 3).map((policy) => (
                      <button
                        key={policy.id}
                        onClick={() => router.push(`/compliance/${policy.id}`)}
                        className="w-full rounded-lg border border-border/50 bg-background p-2 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{policy.name}</div>
                            <div className="text-xs text-muted-foreground">{policy.category} - v{policy.version}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    {group.items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                        No policies in this stage
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Recent Evidence-Linked Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(correlationMap?.recentActivity || []).slice(0, 6).map((activity) => (
            <div key={activity.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="text-sm font-medium">{activity.title}</div>
              <div className="mt-1">
                <SystemRecordBadge value={activity.systemRecordId} compact />
              </div>
            </div>
          ))}
          {(!correlationMap?.recentActivity || correlationMap.recentActivity.length === 0) && (
            <div className="text-sm text-muted-foreground">No evidence-linked activity yet</div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Shield className="h-5 w-5 text-cyan-500" />
            </div>
            Policy Catalog
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-xl shimmer" />
              ))}
            </div>
          ) : filteredPolicies.length > 0 ? (
            <div className="space-y-3">
              {filteredPolicies.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => router.push(`/compliance/${policy.id}`)}
                  className="group w-full flex items-center justify-between p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{policy.name}</h3>
                      <p className="text-sm text-muted-foreground">{policy.category} - v{policy.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${policy.status === "active" ? "bg-emerald-500" : "bg-gray-500"} text-white border-0`}>
                      {policy.status}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-500" />
              </div>
              <p className="text-lg font-medium">No policies found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first policy to get started</p>
              <Button variant="gradient" className="mt-6" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Policy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create New Policy">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}
          <Input
            label="Policy Name"
            placeholder="e.g., Security Incident Response"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe the policy..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "Security", label: "Security" },
              { value: "Compliance", label: "Compliance" },
              { value: "Operations", label: "Operations" },
              { value: "HR", label: "HR" },
              { value: "Finance", label: "Finance" },
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0"
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "deprecated", label: "Deprecated" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>
          <Input
            label="Effective From"
            type="date"
            value={formData.effectiveFrom}
            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Policy"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
