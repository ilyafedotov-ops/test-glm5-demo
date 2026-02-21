"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  ShieldAlert, Filter, Search, Clock, User, Calendar, ChevronRight, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, AlertOctagon, FileWarning, ExternalLink
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Violation {
  id: string;
  policyId: string;
  policyName?: string;
  entityId: string;
  entityType: string;
  status: string;
  severity: string;
  title: string;
  description: string;
  remediation?: string;
  assigneeId?: string;
  assigneeName?: string;
  detectedAt: string;
  acknowledgedAt?: string;
  remediatedAt?: string;
  createdAt: string;
}

interface ViolationResponse {
  data: Violation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

async function fetchViolations(token: string): Promise<ViolationResponse> {
  const res = await fetch(`${API_URL}/violations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch violations");
  return res.json();
}

async function fetchViolationStats(token: string): Promise<ViolationStats> {
  const res = await fetch(`${API_URL}/violations/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function acknowledgeViolation(token: string, id: string) {
  const res = await fetch(`${API_URL}/violations/${id}/acknowledge`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to acknowledge");
  return res.json();
}

async function remediateViolation(token: string, id: string, remediation: string) {
  const res = await fetch(`${API_URL}/violations/${id}/remediate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ remediation }),
  });
  if (!res.ok) throw new Error("Failed to remediate");
  return res.json();
}

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    gradient: "from-rose-600 to-pink-600",
    bg: "bg-rose-500/10",
    color: "text-rose-600 dark:text-rose-400",
    label: "Critical",
    pulse: true,
  },
  high: {
    icon: AlertTriangle,
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-500/10",
    color: "text-orange-600 dark:text-orange-400",
    label: "High",
    pulse: false,
  },
  medium: {
    icon: FileWarning,
    gradient: "from-amber-500 to-yellow-500",
    bg: "bg-amber-500/10",
    color: "text-amber-600 dark:text-amber-400",
    label: "Medium",
    pulse: false,
  },
  low: {
    icon: ShieldAlert,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    color: "text-emerald-600 dark:text-emerald-400",
    label: "Low",
    pulse: false,
  },
} as const;

const statusConfig = {
  open: { icon: AlertTriangle, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", color: "text-rose-600", label: "Open" },
  acknowledged: { icon: CheckCircle2, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10", color: "text-blue-600", label: "Acknowledged" },
  in_remediation: { icon: Clock, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", color: "text-amber-600", label: "In Remediation" },
  remediated: { icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", color: "text-emerald-600", label: "Remediated" },
  closed: { icon: XCircle, gradient: "from-gray-400 to-zinc-400", bg: "bg-gray-500/10", color: "text-gray-500", label: "Closed" },
  false_positive: { icon: XCircle, gradient: "from-slate-400 to-gray-400", bg: "bg-slate-500/10", color: "text-slate-500", label: "False Positive" },
} as const;

export default function ViolationsPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [remediationText, setRemediationText] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["violations"],
    queryFn: () => fetchViolations(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["violations", "stats"],
    queryFn: () => fetchViolationStats(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeViolation(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      addToast({ type: "success", title: "Violation acknowledged" });
    },
    onError: () => addToast({ type: "error", title: "Failed to acknowledge" }),
  });

  const remediateMutation = useMutation({
    mutationFn: ({ id, remediation }: { id: string; remediation: string }) =>
      remediateViolation(token!, id, remediation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      setSelectedViolation(null);
      setRemediationText("");
      addToast({ type: "success", title: "Violation remediated" });
    },
    onError: () => addToast({ type: "error", title: "Failed to remediate" }),
  });

  if (!isAuthenticated) return null;

  const violations = data?.data || [];
  const filteredViolations = violations.filter(v => {
    const matchesSearch = !searchTerm ||
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !filterSeverity || v.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityStyle = (severity: string) =>
    severityConfig[severity as keyof typeof severityConfig] ?? severityConfig.medium;

  const getStatusStyle = (status: string) =>
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.open;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Policy Violations</h1>
          <p className="text-muted-foreground mt-2">
            Track and remediate compliance violations
          </p>
        </div>
        <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card variant="glass" className="group overflow-hidden animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold mt-1 text-rose-500">{stats?.open || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold mt-1 text-amber-500">{stats?.critical || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <AlertOctagon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group overflow-hidden animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="relative pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remediated</p>
                <p className="text-3xl font-bold mt-1 text-emerald-500">{stats?.remediated || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search violations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        <Select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          placeholder="All Severities"
          options={[
            { value: "", label: "All Severities" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <Button variant="glass">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Violations List */}
      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
            </div>
            All Violations ({data?.pagination.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-muted/50 rounded-xl shimmer" />
              ))}
            </div>
          ) : filteredViolations.length > 0 ? (
            <div className="space-y-3">
              {filteredViolations.map((violation, index) => {
                const severityStyle = getSeverityStyle(violation.severity);
                const statusStyle = getStatusStyle(violation.status);
                const SeverityIcon = severityStyle.icon;

                return (
                  <div
                    key={violation.id}
                    onClick={() => setSelectedViolation(violation)}
                    className="group flex items-center justify-between p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-xl ${severityStyle.bg} flex items-center justify-center flex-shrink-0 ${severityStyle.pulse ? 'animate-pulse' : ''}`}>
                        <SeverityIcon className={`h-5 w-5 ${severityStyle.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold truncate">{violation.title}</h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${severityStyle.gradient} text-white`}>
                            {severityStyle.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {violation.description}
                        </p>
                        <div className="flex items-center gap-5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(violation.detectedAt).toLocaleDateString()}
                          </span>
                          {violation.assigneeName && (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {violation.assigneeName}
                            </span>
                          )}
                          {violation.policyName && (
                            <Badge variant="outline" className="text-xs">{violation.policyName}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-lg font-medium">No violations found</p>
              <p className="text-sm text-muted-foreground mt-1">Great! Your system is compliant</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Detail Sheet */}
      <Sheet
        open={!!selectedViolation}
        onClose={() => { setSelectedViolation(null); setRemediationText(""); }}
        title={selectedViolation?.title}
      >
        {selectedViolation && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${getSeverityStyle(selectedViolation.severity).gradient} text-white`}>
                {getSeverityStyle(selectedViolation.severity).label}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusStyle(selectedViolation.status).bg} ${getStatusStyle(selectedViolation.status).color}`}>
                {getStatusStyle(selectedViolation.status).label}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-foreground">{selectedViolation.description}</p>
            </div>

            {selectedViolation.remediation && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-sm font-medium text-emerald-600 mb-2">Remediation Steps</h4>
                <p className="text-foreground">{selectedViolation.remediation}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-muted/50">
                <span className="text-muted-foreground text-xs">Detected</span>
                <p className="font-medium mt-1">{new Date(selectedViolation.detectedAt).toLocaleString()}</p>
              </div>
              {selectedViolation.acknowledgedAt && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Acknowledged</span>
                  <p className="font-medium mt-1">{new Date(selectedViolation.acknowledgedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedViolation.remediatedAt && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Remediated</span>
                  <p className="font-medium mt-1">{new Date(selectedViolation.remediatedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedViolation.policyName && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground text-xs">Policy</span>
                  <p className="font-medium mt-1">{selectedViolation.policyName}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            {selectedViolation.status !== 'remediated' && selectedViolation.status !== 'closed' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>

                {selectedViolation.status === 'open' && (
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => acknowledgeMutation.mutate(selectedViolation.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Acknowledge Violation
                  </Button>
                )}

                {(selectedViolation.status === 'acknowledged' || selectedViolation.status === 'in_remediation') && (
                  <div className="space-y-3">
                    <Textarea
                      label="Remediation Details"
                      placeholder="Describe the steps taken to remediate this violation..."
                      value={remediationText}
                      onChange={(e) => setRemediationText(e.target.value)}
                    />
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => remediateMutation.mutate({ id: selectedViolation.id, remediation: remediationText })}
                      disabled={remediateMutation.isPending || !remediationText.trim()}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Remediated
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-4" />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/violations/${selectedViolation.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
