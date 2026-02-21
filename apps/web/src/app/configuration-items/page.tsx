"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { Database, Plus, Pencil, Trash2, Link2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ConfigurationItem {
  id: string;
  name: string;
  type: string;
  status: string;
  criticality: string;
  environment?: string;
  ownerTeam?: string;
  description?: string;
  linkedIncidentCount?: number;
  relationshipCount?: number;
}

interface ConfigurationItemRelationship {
  targetConfigurationItemId: string;
  relationshipType: string;
  note?: string;
  target?: {
    id: string;
    name: string;
    type: string;
    status: string;
    criticality: string;
    environment?: string;
  } | null;
}

interface ConfigurationItemForm {
  name: string;
  type: string;
  status: string;
  criticality: string;
  environment: string;
  ownerTeam: string;
  description: string;
}

const DEFAULT_FORM: ConfigurationItemForm = {
  name: "",
  type: "application",
  status: "active",
  criticality: "medium",
  environment: "",
  ownerTeam: "",
  description: "",
};

const RELATIONSHIP_TYPES = [
  { value: "depends_on", label: "Depends On" },
  { value: "hosted_on", label: "Hosted On" },
  { value: "connects_to", label: "Connects To" },
  { value: "parent_of", label: "Parent Of" },
  { value: "child_of", label: "Child Of" },
];

async function fetchConfigurationItems(token: string): Promise<ConfigurationItem[]> {
  const res = await fetch(`${API_URL}/configuration-items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch configuration items");
  }

  const payload = await res.json();
  return payload.data || [];
}

async function fetchConfigurationItemRelationships(
  token: string,
  id: string
): Promise<{ data: ConfigurationItemRelationship[]; total: number }> {
  const res = await fetch(`${API_URL}/configuration-items/${id}/relationships`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch relationships");
  }

  return res.json();
}

export default function ConfigurationItemsPage() {
  const { token } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | null>(null);
  const [form, setForm] = useState<ConfigurationItemForm>(DEFAULT_FORM);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [relationshipItem, setRelationshipItem] = useState<ConfigurationItem | null>(null);
  const [relationshipsDraft, setRelationshipsDraft] = useState<ConfigurationItemRelationship[]>([]);
  const [relationshipForm, setRelationshipForm] = useState({
    targetConfigurationItemId: "",
    relationshipType: "depends_on",
    note: "",
  });

  const { data: items = [] } = useQuery({
    queryKey: ["configuration-items"],
    queryFn: () => fetchConfigurationItems(token!),
    enabled: !!token,
  });

  const { data: relationshipsData, isLoading: relationshipsLoading } = useQuery({
    queryKey: ["configuration-item-relationships", relationshipItem?.id],
    queryFn: () => fetchConfigurationItemRelationships(token!, relationshipItem!.id),
    enabled: !!token && relationshipDialogOpen && !!relationshipItem,
  });

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        (item.environment || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["configuration-items"] });

  const refreshRelationships = () =>
    queryClient.invalidateQueries({
      queryKey: ["configuration-item-relationships", relationshipItem?.id],
    });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/configuration-items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create configuration item");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Created", description: "Configuration item created." });
      setDialogOpen(false);
      setForm(DEFAULT_FORM);
      refresh();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Create failed", description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) throw new Error("No configuration item selected");
      const res = await fetch(`${API_URL}/configuration-items/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update configuration item");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Updated", description: "Configuration item updated." });
      setDialogOpen(false);
      setEditingItem(null);
      setForm(DEFAULT_FORM);
      refresh();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Update failed", description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/configuration-items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || "Failed to delete configuration item");
      }
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Deleted", description: "Configuration item deleted." });
      refresh();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Delete failed", description: error.message }),
  });

  const saveRelationshipsMutation = useMutation({
    mutationFn: async () => {
      if (!relationshipItem) throw new Error("No configuration item selected");

      const res = await fetch(`${API_URL}/configuration-items/${relationshipItem.id}/relationships`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relationships: relationshipsDraft.map((relationship) => ({
            targetConfigurationItemId: relationship.targetConfigurationItemId,
            relationshipType: relationship.relationshipType,
            note: relationship.note?.trim() || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || "Failed to save relationships");
      }

      return res.json();
    },
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Relationships updated",
        description: "Configuration item relationships were saved.",
      });
      refresh();
      refreshRelationships();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Save failed", description: error.message }),
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: ConfigurationItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      status: item.status,
      criticality: item.criticality,
      environment: item.environment || "",
      ownerTeam: item.ownerTeam || "",
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const openRelationships = (item: ConfigurationItem) => {
    setRelationshipItem(item);
    setRelationshipDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      addToast({ type: "error", title: "Missing name", description: "Name is required." });
      return;
    }

    if (editingItem) {
      updateMutation.mutate();
      return;
    }

    createMutation.mutate();
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  const relationshipTargets = useMemo(
    () =>
      items.filter((item) => item.id !== relationshipItem?.id).map((item) => ({
        value: item.id,
        label: `${item.name} (${item.type})`,
      })),
    [items, relationshipItem]
  );

  const addRelationship = () => {
    if (!relationshipForm.targetConfigurationItemId) {
      addToast({
        type: "error",
        title: "Select target",
        description: "Choose a configuration item to relate.",
      });
      return;
    }

    const duplicate = relationshipsDraft.some(
      (relationship) =>
        relationship.targetConfigurationItemId === relationshipForm.targetConfigurationItemId &&
        relationship.relationshipType === relationshipForm.relationshipType
    );

    if (duplicate) {
      addToast({
        type: "error",
        title: "Duplicate relationship",
        description: "This relationship already exists.",
      });
      return;
    }

    const target = items.find((item) => item.id === relationshipForm.targetConfigurationItemId);

    setRelationshipsDraft((current) => [
      ...current,
      {
        targetConfigurationItemId: relationshipForm.targetConfigurationItemId,
        relationshipType: relationshipForm.relationshipType,
        note: relationshipForm.note || undefined,
        target: target
          ? {
              id: target.id,
              name: target.name,
              type: target.type,
              status: target.status,
              criticality: target.criticality,
              environment: target.environment,
            }
          : null,
      },
    ]);

    setRelationshipForm({
      targetConfigurationItemId: "",
      relationshipType: "depends_on",
      note: "",
    });
  };

  const removeRelationship = (index: number) => {
    setRelationshipsDraft((current) => current.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (relationshipDialogOpen) {
      setRelationshipsDraft(relationshipsData?.data || []);
    }
  }, [relationshipDialogOpen, relationshipsData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Configuration Items</h1>
          <p className="text-muted-foreground mt-1">Manage CMDB records and service dependencies.</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search configuration items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            CMDB ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border border-white/10 bg-muted/30 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.type} • {item.environment || "no environment"} • incidents linked: {item.linkedIncidentCount || 0}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {item.status}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {item.criticality}
                    </Badge>
                    <Badge variant="outline">relationships: {item.relationshipCount || 0}</Badge>
                    {item.ownerTeam && <Badge variant="outline">{item.ownerTeam}</Badge>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openRelationships(item)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Relationships
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No configuration items found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingItem ? "Edit Configuration Item" : "Add Configuration Item"}
        size={editingItem ? "md" : "lg"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Type"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            placeholder="application | service | database | infrastructure"
          />
          <Input
            label="Status"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            placeholder="active | maintenance | retired"
          />
          <Input
            label="Criticality"
            value={form.criticality}
            onChange={(e) => setForm((prev) => ({ ...prev, criticality: e.target.value }))}
            placeholder="low | medium | high | critical"
          />
          <Input
            label="Environment"
            value={form.environment}
            onChange={(e) => setForm((prev) => ({ ...prev, environment: e.target.value }))}
            placeholder="production"
          />
          <Input
            label="Owner Team"
            value={form.ownerTeam}
            onChange={(e) => setForm((prev) => ({ ...prev, ownerTeam: e.target.value }))}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={relationshipDialogOpen}
        onClose={() => {
          setRelationshipDialogOpen(false);
          setRelationshipItem(null);
          setRelationshipsDraft([]);
          setRelationshipForm({
            targetConfigurationItemId: "",
            relationshipType: "depends_on",
            note: "",
          });
        }}
        title={relationshipItem ? `Relationships · ${relationshipItem.name}` : "Relationships"}
      >
        <div className="space-y-4">
          {relationshipsLoading ? (
            <div className="text-sm text-muted-foreground">Loading relationships...</div>
          ) : (
            <>
              <div className="space-y-2">
                {relationshipsDraft.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No relationships configured.
                  </div>
                ) : (
                  relationshipsDraft.map((relationship, index) => (
                    <div
                      key={`${relationship.relationshipType}-${relationship.targetConfigurationItemId}-${index}`}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">
                            {relationship.target?.name || relationship.targetConfigurationItemId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {relationship.relationshipType.replace(/_/g, " ")}
                          </div>
                          {relationship.note ? (
                            <div className="text-xs text-muted-foreground mt-1">{relationship.note}</div>
                          ) : null}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeRelationship(index)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <Select
                  label="Target Configuration Item"
                  value={relationshipForm.targetConfigurationItemId}
                  onChange={(event) =>
                    setRelationshipForm((current) => ({
                      ...current,
                      targetConfigurationItemId: event.target.value,
                    }))
                  }
                  options={[{ value: "", label: "Select target item" }, ...relationshipTargets]}
                />
                <Select
                  label="Relationship Type"
                  value={relationshipForm.relationshipType}
                  onChange={(event) =>
                    setRelationshipForm((current) => ({
                      ...current,
                      relationshipType: event.target.value,
                    }))
                  }
                  options={RELATIONSHIP_TYPES}
                />
                <Input
                  label="Note (optional)"
                  value={relationshipForm.note}
                  onChange={(event) =>
                    setRelationshipForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
                <Button variant="outline" onClick={addRelationship}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Relationship
                </Button>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRelationshipDialogOpen(false);
                setRelationshipItem(null);
                setRelationshipsDraft([]);
              }}
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => saveRelationshipsMutation.mutate()}
              disabled={saveRelationshipsMutation.isPending}
            >
              {saveRelationshipsMutation.isPending ? "Saving..." : "Save Relationships"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
