"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { Bell, Webhook, Plus, Trash2, Pencil, Play } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface NotificationPreferences {
  emailIncidentAssigned: boolean;
  emailIncidentResolved: boolean;
  emailSlaBreached: boolean;
  emailChangeApproved: boolean;
  emailDailyDigest: boolean;
  inAppAll: boolean;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string;
}

interface WebhookFormState {
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
}

const AVAILABLE_EVENTS = [
  "incident.created",
  "incident.updated",
  "incident.resolved",
  "problem.created",
  "problem.resolved",
  "change.created",
  "change.approved",
  "change.implemented",
  "sla.breach",
] as const;

const EMPTY_WEBHOOK_FORM: WebhookFormState = {
  name: "",
  url: "",
  secret: "",
  events: [],
  isActive: true,
};

async function fetchPreferences(token: string): Promise<NotificationPreferences> {
  const res = await fetch(`${API_URL}/notifications/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch notification preferences");
  }

  return res.json();
}

async function fetchWebhooks(token: string): Promise<WebhookItem[]> {
  const res = await fetch(`${API_URL}/settings/webhooks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch webhooks");
  }

  return res.json();
}

async function createWebhook(token: string, data: WebhookFormState): Promise<WebhookItem> {
  const res = await fetch(`${API_URL}/settings/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      url: data.url,
      secret: data.secret || undefined,
      events: data.events,
      isActive: data.isActive,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to create webhook");
  }

  return res.json();
}

async function updateWebhook(token: string, id: string, data: WebhookFormState): Promise<WebhookItem> {
  const res = await fetch(`${API_URL}/settings/webhooks/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      url: data.url,
      secret: data.secret || undefined,
      events: data.events,
      isActive: data.isActive,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update webhook");
  }

  return res.json();
}

async function removeWebhook(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/settings/webhooks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete webhook");
  }
}

async function testWebhook(token: string, id: string): Promise<{ success: boolean; status?: number; message?: string }> {
  const res = await fetch(`${API_URL}/settings/webhooks/${id}/test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { success: data.success ?? res.ok, status: data.status ?? res.status, message: data.message };
}

export default function SettingsPage() {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState("notifications");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const [webhookForm, setWebhookForm] = useState<WebhookFormState>(EMPTY_WEBHOOK_FORM);

  const { data: prefs } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => fetchPreferences(token!),
    enabled: !!token,
  });

  const { data: webhooks } = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => fetchWebhooks(token!),
    enabled: !!token && !!user && (user.roles?.some((role) => role.name === "admin") || user.permissions?.some((permission) => permission.name === "admin:all")),
  });

  const isAdminUser =
    !!user &&
    (user.roles?.some((role) => role.name === "admin") ||
      user.permissions?.some((permission) => permission.name === "admin:all"));

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await fetch(`${API_URL}/notifications/preferences`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: (data: WebhookFormState) => createWebhook(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setDialogOpen(false);
      setEditingWebhook(null);
      setWebhookForm(EMPTY_WEBHOOK_FORM);
      addToast({
        type: "success",
        title: "Webhook created",
        description: "The webhook has been created successfully.",
      });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Create failed", description: error.message });
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WebhookFormState }) =>
      updateWebhook(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setDialogOpen(false);
      setEditingWebhook(null);
      setWebhookForm(EMPTY_WEBHOOK_FORM);
      addToast({
        type: "success",
        title: "Webhook updated",
        description: "The webhook has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Update failed", description: error.message });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => removeWebhook(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      addToast({
        type: "success",
        title: "Webhook deleted",
        description: "The webhook has been deleted.",
      });
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Delete failed", description: error.message });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: string) => testWebhook(token!, id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["webhooks"] });
        addToast({
          type: "success",
          title: "Test sent",
          description: "Test payload was sent successfully.",
        });
      } else {
        addToast({
          type: "error",
          title: "Test failed",
          description: result.message || `HTTP ${result.status}`,
        });
      }
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Test failed", description: error.message });
    },
  });

  const webhookDialogTitle = useMemo(
    () => (editingWebhook ? "Edit Webhook" : "Add Webhook"),
    [editingWebhook]
  );

  const togglePref = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    updatePrefsMutation.mutate({ [key]: !prefs[key] });
  };

  const openCreateWebhook = () => {
    setEditingWebhook(null);
    setWebhookForm(EMPTY_WEBHOOK_FORM);
    setDialogOpen(true);
  };

  const openEditWebhook = (webhook: WebhookItem) => {
    setEditingWebhook(webhook);
    setWebhookForm({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || "",
      events: webhook.events || [],
      isActive: webhook.isActive,
    });
    setDialogOpen(true);
  };

  const submitWebhook = () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
      addToast({
        type: "error",
        title: "Invalid webhook",
        description: "Name and URL are required.",
      });
      return;
    }

    if (webhookForm.events.length === 0) {
      addToast({
        type: "error",
        title: "Invalid webhook",
        description: "Select at least one event.",
      });
      return;
    }

    if (editingWebhook) {
      updateWebhookMutation.mutate({ id: editingWebhook.id, data: webhookForm });
      return;
    }

    createWebhookMutation.mutate(webhookForm);
  };

  const isSavingWebhook = createWebhookMutation.isPending || updateWebhookMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and integrations</p>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-4">
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          onClick={() => setActiveTab("notifications")}
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </Button>
        <Button
          variant={activeTab === "webhooks" ? "default" : "ghost"}
          onClick={() => setActiveTab("webhooks")}
          disabled={!isAdminUser}
        >
          <Webhook className="h-4 w-4 mr-2" />
          Webhooks
        </Button>
      </div>

      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <PreferenceToggle
                  label="Incident Assigned"
                  description="Receive an email when an incident is assigned to you"
                  checked={prefs?.emailIncidentAssigned ?? true}
                  onChange={() => togglePref("emailIncidentAssigned")}
                />
                <Separator />
                <PreferenceToggle
                  label="Incident Resolved"
                  description="Receive an email when your incident is resolved"
                  checked={prefs?.emailIncidentResolved ?? true}
                  onChange={() => togglePref("emailIncidentResolved")}
                />
                <Separator />
                <PreferenceToggle
                  label="SLA Breached"
                  description="Receive alerts when SLA is about to breach"
                  checked={prefs?.emailSlaBreached ?? true}
                  onChange={() => togglePref("emailSlaBreached")}
                />
                <Separator />
                <PreferenceToggle
                  label="Change Approved"
                  description="Receive notifications when a change is approved"
                  checked={prefs?.emailChangeApproved ?? true}
                  onChange={() => togglePref("emailChangeApproved")}
                />
                <Separator />
                <PreferenceToggle
                  label="Daily Digest"
                  description="Receive a daily summary of your incidents and tasks"
                  checked={prefs?.emailDailyDigest ?? false}
                  onChange={() => togglePref("emailDailyDigest")}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold mb-4">In-App Notifications</h3>
              <PreferenceToggle
                label="All Notifications"
                description="Show all in-app notifications"
                checked={prefs?.inAppAll ?? true}
                onChange={() => togglePref("inAppAll")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "webhooks" && isAdminUser && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Webhooks</CardTitle>
                <Button variant="gradient" size="sm" onClick={openCreateWebhook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks && webhooks.length > 0 ? (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-white/10"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{webhook.name}</h4>
                          <Badge variant={webhook.isActive ? "success" : "secondary"}>
                            {webhook.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{webhook.url}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        {webhook.lastTriggeredAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditWebhook(webhook)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          disabled={deleteWebhookMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No webhooks configured</p>
                  <Button className="mt-4" variant="outline" onClick={openCreateWebhook}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first webhook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event} className="p-3 rounded-lg bg-muted/30 border border-white/10">
                    <code className="text-xs">{event}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={webhookDialogTitle}>
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Incident Sync"
            value={webhookForm.name}
            onChange={(e) => setWebhookForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="URL"
            placeholder="https://example.com/webhooks/incidents"
            value={webhookForm.url}
            onChange={(e) => setWebhookForm((prev) => ({ ...prev, url: e.target.value }))}
          />
          <Input
            label="Secret (optional)"
            placeholder="shared-secret"
            value={webhookForm.secret}
            onChange={(e) => setWebhookForm((prev) => ({ ...prev, secret: e.target.value }))}
          />

          <div>
            <p className="text-sm font-medium mb-2">Events</p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-white/10 rounded-md p-3">
              {AVAILABLE_EVENTS.map((event) => {
                const checked = webhookForm.events.includes(event);
                return (
                  <label key={event} className="flex items-center justify-between gap-3 text-sm">
                    <span>{event}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setWebhookForm((prev) => ({
                          ...prev,
                          events: e.target.checked
                            ? [...prev.events, event]
                            : prev.events.filter((item) => item !== event),
                        }));
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center justify-between text-sm">
            <span>Active</span>
            <input
              type="checkbox"
              checked={webhookForm.isActive}
              onChange={(e) => setWebhookForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={submitWebhook} disabled={isSavingWebhook}>
              {isSavingWebhook ? "Saving..." : editingWebhook ? "Save Changes" : "Create Webhook"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
