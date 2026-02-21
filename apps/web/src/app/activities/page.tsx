"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  Activity,
  RefreshCw,
  Filter,
  ArrowRight,
  Database,
  ListChecks,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";

interface ActivityItem {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface ActivitiesResponse {
  data: ActivityItem[];
  total: number;
}

async function fetchActivities(
  token: string,
  params: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ActivitiesResponse> {
  const searchParams = new URLSearchParams();
  if (params.entityType) searchParams.set("entityType", params.entityType);
  if (params.entityId) searchParams.set("entityId", params.entityId);
  if (params.actorId) searchParams.set("actorId", params.actorId);
  if (params.action) searchParams.set("action", params.action);
  if (params.search) searchParams.set("search", params.search);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/activities${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}

async function fetchRecentActivities(token: string): Promise<ActivityItem[]> {
  const res = await fetch(`${API_URL}/activities/recent?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch recent activity");
  return res.json();
}

async function fetchTimeline(token: string, entityType: string, entityId: string): Promise<ActivityItem[]> {
  const res = await fetch(`${API_URL}/activities/timeline/${entityType}/${entityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivitiesPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();

  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [chronology, setChronology] = useState("desc");
  const [pageSize, setPageSize] = useState("50");
  const [offset, setOffset] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState<{ entityType: string; entityId: string } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "activities",
      entityType,
      entityId,
      actorId,
      action,
      search,
      fromDate,
      toDate,
      pageSize,
      offset,
    ],
    queryFn: () =>
      fetchActivities(token!, {
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        actorId: actorId || undefined,
        action: action || undefined,
        search: search || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: parseInt(pageSize, 10),
        offset,
      }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: recent } = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: () => fetchRecentActivities(token!),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["activities", "timeline", selectedEntity?.entityType, selectedEntity?.entityId],
    queryFn: () => fetchTimeline(token!, selectedEntity!.entityType, selectedEntity!.entityId),
    enabled: isAuthenticated && !!token && !!selectedEntity,
    retry: false,
  });

  const { data: selectedActivityTimeline, isLoading: selectedActivityTimelineLoading } = useQuery({
    queryKey: [
      "activities",
      "timeline",
      "dialog",
      selectedActivity?.entityType,
      selectedActivity?.entityId,
    ],
    queryFn: () => fetchTimeline(token!, selectedActivity!.entityType, selectedActivity!.entityId),
    enabled: isAuthenticated && !!token && !!selectedActivity,
    retry: false,
  });

  const items = useMemo(() => data?.data ?? [], [data?.data]);
  const orderedItems = useMemo(() => {
    const sorted = [...items].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return chronology === "asc" ? leftTime - rightTime : rightTime - leftTime;
    });
    return sorted;
  }, [items, chronology]);
  const orderedTimeline = useMemo(() => {
    const source = timeline || [];
    return [...source].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return chronology === "asc" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [timeline, chronology]);
  const orderedSelectedActivityTimeline = useMemo(() => {
    const source = selectedActivityTimeline || [];
    return [...source].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return chronology === "asc" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [selectedActivityTimeline, chronology]);

  const stats = useMemo(() => {
    const byEntity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    for (const item of items) {
      byEntity[item.entityType] = (byEntity[item.entityType] || 0) + 1;
      byAction[item.action] = (byAction[item.action] || 0) + 1;
    }
    return {
      total: data?.total || 0,
      entityTypes: Object.keys(byEntity).length,
      actions: Object.keys(byAction).length,
      mostCommonEntity: Object.entries(byEntity).sort((a, b) => b[1] - a[1])[0]?.[0] || "n/a",
    };
  }, [data?.total, items]);

  const total = data?.total || 0;
  const currentPageSize = parseInt(pageSize, 10);
  const hasPrevious = offset > 0;
  const hasNext = offset + currentPageSize < total;

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Activity Center</h1>
          <p className="text-muted-foreground mt-2">Organization-wide event stream from incidents, workflows, tasks, compliance and changes.</p>
        </div>
        <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Events</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Entity Types</p>
            <p className="text-3xl font-bold mt-1">{stats.entityTypes}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Action Types</p>
            <p className="text-3xl font-bold mt-1">{stats.actions}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Entity</p>
            <p className="text-xl font-semibold mt-1 capitalize">{stats.mostCommonEntity.replace("_", " ")}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Select
            label="Entity Type"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setOffset(0);
            }}
            options={[
              { value: "", label: "All entity types" },
              { value: "incident", label: "Incident" },
              { value: "workflow", label: "Workflow" },
              { value: "task", label: "Task" },
              { value: "violation", label: "Violation" },
              { value: "policy", label: "Policy" },
              { value: "problem", label: "Problem" },
              { value: "change", label: "Change" },
            ]}
          />
          <Input
            label="Entity ID"
            placeholder="Filter by entity ID"
            value={entityId}
            onChange={(event) => {
              setEntityId(event.target.value);
              setOffset(0);
            }}
          />
          <Input
            label="Actor ID"
            placeholder="Filter by actor ID"
            value={actorId}
            onChange={(event) => {
              setActorId(event.target.value);
              setOffset(0);
            }}
          />
          <Input
            label="Action"
            placeholder="created, updated, assigned..."
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setOffset(0);
            }}
          />
          <Input
            label="Search"
            placeholder="Search title/description/action"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
          />
          <Input
            label="From"
            type="datetime-local"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setOffset(0);
            }}
          />
          <Input
            label="To"
            type="datetime-local"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setOffset(0);
            }}
          />
          <Select
            label="Page Size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(event.target.value);
              setOffset(0);
            }}
            options={[
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
          />
          <Select
            label="Chronology"
            value={chronology}
            onChange={(event) => setChronology(event.target.value)}
            options={[
              { value: "desc", label: "Newest first" },
              { value: "asc", label: "Oldest first" },
            ]}
          />
          <Button
            variant="outline"
            className="self-end"
            onClick={() => {
              setEntityType("");
              setEntityId("");
              setActorId("");
              setAction("");
              setSearch("");
              setFromDate("");
              setToDate("");
              setChronology("desc");
              setPageSize("50");
              setOffset(0);
            }}
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading activities...</div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {orderedItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/20 bg-white/30 p-4 dark:border-white/10 dark:bg-slate-800/30">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{item.entityType}</Badge>
                      <Badge variant="outline">{item.action}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="font-medium mt-2">{item.title}</p>
                    {item.description ? <p className="text-sm text-muted-foreground mt-1">{item.description}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> {item.entityId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEntity({ entityType: item.entityType, entityId: item.entityId });
                          setSelectedActivity(item);
                        }}
                      >
                        Inspect
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      {item.entityType === "incident" && (
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/incidents/${item.entityId}`)}>Open</Button>
                      )}
                      {item.entityType === "workflow" && (
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/workflows/${item.entityId}`)}>Open</Button>
                      )}
                      {item.entityType === "task" && (
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/tasks/${item.entityId}`)}>Open</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No activities found for the selected filters.</div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {Math.min(offset + 1, total)}-{Math.min(offset + currentPageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasPrevious}
                  onClick={() => setOffset((current) => Math.max(0, current - currentPageSize))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasNext}
                  onClick={() => setOffset((current) => current + currentPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Recent Stream</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recent || []).slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedEntity({ entityType: item.entityType, entityId: item.entityId });
                    setSelectedActivity(item);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/20 p-3 text-left hover:bg-white/40 dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                >
                  <p className="text-xs text-muted-foreground">{item.entityType} · {item.action}</p>
                  <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                </button>
              ))}
              {!recent?.length && <p className="text-sm text-muted-foreground">No recent activity.</p>}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                Entity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntity ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {selectedEntity.entityType}:{selectedEntity.entityId}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedEntity(null);
                        setSelectedActivity(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  {timelineLoading ? (
                    <p className="text-sm text-muted-foreground">Loading timeline...</p>
                  ) : (
                    <div className="space-y-3">
                      {orderedTimeline.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-lg bg-muted/40 p-3">
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                        </div>
                      ))}
                      {timeline && timeline.length === 0 && (
                        <p className="text-sm text-muted-foreground">No timeline events.</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select an activity to inspect its timeline.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity ? `Activity: ${selectedActivity.action}` : "Activity"}
      >
        {selectedActivity ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{selectedActivity.entityType}</Badge>
                <Badge variant="outline">{selectedActivity.action}</Badge>
              </div>
              <p className="mt-2 text-sm font-medium">{selectedActivity.title}</p>
              {selectedActivity.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{selectedActivity.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedActivity.entityType}:{selectedActivity.entityId} · {formatDate(selectedActivity.createdAt)}
              </p>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Entity Timeline</h4>
              {selectedActivityTimelineLoading ? (
                <p className="text-sm text-muted-foreground">Loading timeline...</p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {orderedSelectedActivityTimeline.map((item) => (
                    <div key={item.id} className="rounded-md border border-white/20 bg-white/30 p-2 dark:border-white/10 dark:bg-slate-800/30">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  ))}
                  {selectedActivityTimeline && selectedActivityTimeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No timeline events for this entity.</p>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Metadata</h4>
              <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(selectedActivity.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              {selectedActivity.entityType === "incident" && (
                <Button variant="outline" onClick={() => router.push(`/incidents/${selectedActivity.entityId}`)}>
                  Open Incident
                </Button>
              )}
              {selectedActivity.entityType === "workflow" && (
                <Button variant="outline" onClick={() => router.push(`/workflows/${selectedActivity.entityId}`)}>
                  Open Workflow
                </Button>
              )}
              {selectedActivity.entityType === "task" && (
                <Button variant="outline" onClick={() => router.push(`/tasks/${selectedActivity.entityId}`)}>
                  Open Task
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
