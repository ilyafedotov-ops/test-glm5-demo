"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { FileText, Plus, Search, Calendar, User, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { TicketNumberBadge } from "@/components/ui/ticket-badge";

interface ChangeRequest {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  reason: string;
  type: string;
  status: string;
  riskLevel: string;
  impactLevel: string;
  plannedStart?: string;
  plannedEnd?: string;
  createdAt: string;
  requester?: { id: string; firstName: string; lastName: string; email: string };
  assignee?: { id: string; firstName: string; lastName: string; email: string };
  team?: { id: string; name: string };
  _count?: { approvals: number; tasks: number; incidents: number };
}

interface ChangesResponse {
  data: ChangeRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function fetchChanges(token: string): Promise<ChangesResponse> {
  const res = await fetch(`${API_URL}/changes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch changes");
  return res.json();
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "bg-gray-500/10 text-gray-600", icon: FileText, label: "Draft" },
  requested: { color: "bg-blue-500/10 text-blue-600", icon: Clock, label: "Requested" },
  assessing: { color: "bg-purple-500/10 text-purple-600", icon: AlertTriangle, label: "Assessing" },
  scheduled: { color: "bg-cyan-500/10 text-cyan-600", icon: Calendar, label: "Scheduled" },
  approved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle, label: "Approved" },
  rejected: { color: "bg-rose-500/10 text-rose-600", icon: XCircle, label: "Rejected" },
  implementing: { color: "bg-orange-500/10 text-orange-600", icon: FileText, label: "Implementing" },
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

export default function ChangesPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["changes"],
    queryFn: () => fetchChanges(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const filteredChanges = data?.data?.filter((change) =>
    change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    change.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Management</h1>
          <p className="text-muted-foreground mt-1">
            Plan, approve, and track changes to your IT environment
          </p>
        </div>
        <Button onClick={() => router.push("/changes/new")} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          Create Change
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Changes</p>
                <p className="text-3xl font-bold">{data?.pagination?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold">
                  {filteredChanges.filter((c) => c.status === "requested" || c.status === "assessing").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Implementing</p>
                <p className="text-3xl font-bold">
                  {filteredChanges.filter((c) => c.status === "implementing").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">
                  {filteredChanges.filter((c) => c.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Change Requests</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search changes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
                />
              </div>
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
              <p className="mt-4 text-muted-foreground">Loading changes...</p>
            </div>
          ) : filteredChanges.length > 0 ? (
            <div className="space-y-3">
              {filteredChanges.map((change, index) => {
                const statusStyle = statusConfig[change.status] || statusConfig["draft"];
                const typeStyle = typeConfig[change.type] || typeConfig["normal"];
                const riskStyle = riskConfig[change.riskLevel] || riskConfig["medium"];
                const StatusIcon = statusStyle.icon;

                return (
                  <div
                    key={change.id}
                    onClick={() => router.push(`/changes/${change.id}`)}
                    className="group flex items-center justify-between p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <TicketNumberBadge ticketNumber={change.ticketNumber} compact />
                        <Badge className={typeStyle.color}>{typeStyle.label}</Badge>
                        <h3 className="font-semibold truncate">{change.title}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusStyle.color}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                        {change.reason}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(change.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`font-medium ${riskStyle.color}`}>
                          Risk: {riskStyle.label}
                        </span>
                        {change.plannedStart && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Start: {new Date(change.plannedStart).toLocaleDateString()}
                          </span>
                        )}
                        {change._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {change._count.approvals} approvals
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Requested by</p>
                        <p className="text-sm font-medium">
                          {change.requester?.firstName} {change.requester?.lastName}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium">No change requests found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first change request</p>
              <Button variant="gradient" className="mt-6" onClick={() => router.push("/changes/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
