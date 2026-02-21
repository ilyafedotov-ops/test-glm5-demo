"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface ChangeRequestResponse {
  id: string;
}

interface CreateChangePayload {
  title: string;
  description: string;
  reason: string;
  type?: string;
  riskLevel?: string;
  impactLevel?: string;
  rollbackPlan?: string;
  testPlan?: string;
  plannedStart?: string;
  plannedEnd?: string;
  incidentIds?: string[];
}

async function createChange(token: string, payload: CreateChangePayload): Promise<ChangeRequestResponse> {
  const res = await fetch(`${API_URL}/changes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({}));
    throw new Error(errorPayload.message || "Failed to create change request");
  }

  return res.json();
}

export default function NewChangePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [form, setForm] = useState({
    title: "",
    description: "",
    reason: "",
    type: "normal",
    riskLevel: "medium",
    impactLevel: "medium",
    rollbackPlan: "",
    testPlan: "",
    plannedStart: "",
    plannedEnd: "",
    incidentIds: "",
  });
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () => {
      const incidentIds = form.incidentIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      return createChange(token!, {
        title: form.title,
        description: form.description,
        reason: form.reason,
        type: form.type,
        riskLevel: form.riskLevel,
        impactLevel: form.impactLevel,
        rollbackPlan: form.rollbackPlan || undefined,
        testPlan: form.testPlan || undefined,
        plannedStart: form.plannedStart ? new Date(form.plannedStart).toISOString() : undefined,
        plannedEnd: form.plannedEnd ? new Date(form.plannedEnd).toISOString() : undefined,
        incidentIds: incidentIds.length > 0 ? incidentIds : undefined,
      });
    },
    onSuccess: (data) => {
      addToast({ type: "success", title: "Change request created" });
      router.push(`/changes/${data.id}`);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Failed to create change request");
    },
  });

  if (!isAuthenticated) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.reason.trim()) {
      setError("Title, description, and reason are required");
      return;
    }

    setError("");
    createMutation.mutate();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Create Change Request</h1>
          <p className="text-muted-foreground mt-2">Capture risk, implementation, and rollback details for CAB and implementation teams.</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/changes")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Changes
        </Button>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Change Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            <Input
              label="Title"
              placeholder="Database server patching"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />

            <Textarea
              label="Description"
              placeholder="Detailed implementation steps"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              required
            />

            <Textarea
              label="Reason"
              placeholder="Business and technical justification"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              rows={3}
              required
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="Type"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "normal", label: "Normal" },
                  { value: "emergency", label: "Emergency" },
                ]}
              />
              <Select
                label="Risk Level"
                value={form.riskLevel}
                onChange={(event) => setForm((current) => ({ ...current, riskLevel: event.target.value }))}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
              <Select
                label="Impact Level"
                value={form.impactLevel}
                onChange={(event) => setForm((current) => ({ ...current, impactLevel: event.target.value }))}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Planned Start"
                type="datetime-local"
                value={form.plannedStart}
                onChange={(event) => setForm((current) => ({ ...current, plannedStart: event.target.value }))}
              />
              <Input
                label="Planned End"
                type="datetime-local"
                value={form.plannedEnd}
                onChange={(event) => setForm((current) => ({ ...current, plannedEnd: event.target.value }))}
              />
            </div>

            <Textarea
              label="Test Plan"
              placeholder="How change success will be validated"
              value={form.testPlan}
              onChange={(event) => setForm((current) => ({ ...current, testPlan: event.target.value }))}
              rows={3}
            />

            <Textarea
              label="Rollback Plan"
              placeholder="Backout procedure if implementation fails"
              value={form.rollbackPlan}
              onChange={(event) => setForm((current) => ({ ...current, rollbackPlan: event.target.value }))}
              rows={3}
            />

            <Input
              label="Linked Incident IDs (comma-separated, optional)"
              placeholder="uuid-1, uuid-2"
              value={form.incidentIds}
              onChange={(event) => setForm((current) => ({ ...current, incidentIds: event.target.value }))}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.push("/changes")}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
                <Save className="h-4 w-4" />
                {createMutation.isPending ? "Creating..." : "Create Change"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
