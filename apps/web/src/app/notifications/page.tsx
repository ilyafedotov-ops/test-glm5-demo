"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { Bell, CheckCheck, RefreshCw, Trash2, ExternalLink, Filter } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationsResponse {
  data: NotificationItem[];
  unreadCount: number;
}

async function fetchNotifications(
  token: string,
  filters: { unreadOnly: boolean; type: string }
): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (filters.unreadOnly) {
    searchParams.set("unread", "true");
  }
  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/notifications${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function markNotificationRead(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to mark notification as read");
}

async function markAllNotificationsRead(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}

async function deleteNotification(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to delete notification");
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

export default function NotificationsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [type, setType] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", unreadOnly, type],
    queryFn: () => fetchNotifications(token!, { unreadOnly, type }),
    enabled: isAuthenticated && !!token,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      addToast({ type: "success", title: "All notifications marked as read" });
    },
    onError: () => {
      addToast({ type: "error", title: "Failed to mark notifications as read" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!isAuthenticated) return null;

  const items = data?.data || [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Central inbox for incident, workflow, SLA and compliance alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold mt-1">{items.length}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{data?.unreadCount || 0}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Read</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">{Math.max(items.length - (data?.unreadCount || 0), 0)}</p>
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
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Select
            label="Type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={[
              { value: "", label: "All types" },
              { value: "incident_created", label: "Incident Created" },
              { value: "incident_assigned", label: "Incident Assigned" },
              { value: "incident_updated", label: "Incident Updated" },
              { value: "incident_resolved", label: "Incident Resolved" },
              { value: "sla_breach_warning", label: "SLA Warning" },
              { value: "sla_breached", label: "SLA Breached" },
              { value: "policy_violation", label: "Policy Violation" },
              { value: "violation_assigned", label: "Violation Assigned" },
              { value: "workflow_assigned", label: "Workflow Assigned" },
              { value: "workflow_completed", label: "Workflow Completed" },
              { value: "report_ready", label: "Report Ready" },
              { value: "system_alert", label: "System Alert" },
            ]}
          />
          <Select
            label="Read State"
            value={unreadOnly ? "unread" : "all"}
            onChange={(event) => setUnreadOnly(event.target.value === "unread")}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread Only" },
            ]}
          />
          <Button
            variant="outline"
            className="self-end"
            onClick={() => {
              setType("");
              setUnreadOnly(false);
            }}
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    item.isRead
                      ? "border-white/20 bg-white/20 dark:border-white/10 dark:bg-slate-800/20"
                      : "border-amber-500/40 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.isRead ? "secondary" : "warning"}>{item.isRead ? "Read" : "Unread"}</Badge>
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="font-medium mt-2">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                    </div>
                    <div className="flex gap-1">
                      {!item.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markReadMutation.mutate(item.id)}
                          disabled={markReadMutation.isPending}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {item.actionUrl ? (
                    <div className="mt-3">
                      <Button size="sm" variant="ghost" asChild>
                        <a href={item.actionUrl}>
                          Open Linked Resource
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
