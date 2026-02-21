"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { Check, RefreshCw, Search, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type ServiceRequestStatus = "requested" | "approved" | "denied" | "fulfilled" | "closed";

interface ServiceRequestTransition {
  id: string;
  action: string;
  fromStatus?: ServiceRequestStatus | null;
  toStatus: ServiceRequestStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  actor?: { id: string; firstName: string; lastName: string; email?: string } | null;
}

interface ServiceRequest {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  deniedAt?: string | null;
  denialReason?: string | null;
  fulfilledAt?: string | null;
  fulfillmentNotes?: string | null;
  lastTransitionAt?: string | null;
  serviceItem?: { id: string; name: string; category: string };
  requester?: { id: string; firstName: string; lastName: string; email: string };
  assignee?: { id: string; firstName: string; lastName: string; email?: string };
  approvedBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
  deniedBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
  fulfilledBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
  transitions?: ServiceRequestTransition[];
}

interface ServiceRequestsResponse {
  data: ServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchServiceRequests(token: string, status?: string): Promise<ServiceRequestsResponse> {
  const searchParams = new URLSearchParams();
  if (status) searchParams.set("status", status);
  const query = searchParams.toString();
  const res = await fetch(`${API_URL}/service-catalog/requests${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch service requests");
  return res.json();
}

async function fetchServiceRequest(token: string, id: string): Promise<ServiceRequest> {
  const res = await fetch(`${API_URL}/service-catalog/requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch service request details");
  return res.json();
}

async function transitionRequest(
  token: string,
  id: string,
  action: "approve" | "reject" | "fulfill",
  payload?: { reason?: string; notes?: string }
) {
  const body =
    action === "reject"
      ? { reason: payload?.reason || "" }
      : action === "fulfill"
        ? { notes: payload?.notes || "" }
        : { notes: payload?.notes || "" };

  const res = await fetch(`${API_URL}/service-catalog/requests/${id}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Failed to ${action} request`);
  return res.json();
}

export default function ServiceRequestsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [fulfillNotes, setFulfillNotes] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["service-requests", statusFilter],
    queryFn: () => fetchServiceRequests(token!, statusFilter || undefined),
    enabled: isAuthenticated && !!token,
  });

  const { data: requestDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["service-request", selectedRequestId],
    queryFn: () => fetchServiceRequest(token!, selectedRequestId!),
    enabled: isAuthenticated && !!token && !!selectedRequestId,
  });

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
      payload,
    }: {
      id: string;
      action: "approve" | "reject" | "fulfill";
      payload?: { reason?: string; notes?: string };
    }) => transitionRequest(token!, id, action, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-request", variables.id] });
      addToast({
        type: "success",
        title: "Request updated",
        description: `Request ${variables.action} action applied.`,
      });
      if (variables.action === "reject") setRejectReason("");
      if (variables.action === "approve") setApprovalNotes("");
      if (variables.action === "fulfill") setFulfillNotes("");
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Request update failed",
        description: error.message,
      });
    },
  });

  const requests = data?.data || [];
  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const term = search.toLowerCase();
    return requests.filter((request) => {
      return (
        request.ticketNumber.toLowerCase().includes(term) ||
        request.title.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term) ||
        request.serviceItem?.name.toLowerCase().includes(term)
      );
    });
  }, [requests, search]);

  const statusCounts = useMemo(() => {
    return requests.reduce<Record<string, number>>((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {});
  }, [requests]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Request Inbox</h1>
          <p className="mt-1 text-muted-foreground">
            Review, approve, reject, and fulfill service requests.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-3xl font-bold">{requests.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Requested</p><p className="text-3xl font-bold">{statusCounts["requested"] || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Approved</p><p className="text-3xl font-bold">{statusCounts["approved"] || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Denied</p><p className="text-3xl font-bold">{statusCounts["denied"] || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Fulfilled</p><p className="text-3xl font-bold">{statusCounts["fulfilled"] || 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket, title, description, or service"
              className="w-full rounded-lg border border-white/20 bg-white/50 py-2 pl-10 pr-3"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "requested", label: "Requested" },
              { value: "approved", label: "Approved" },
              { value: "denied", label: "Denied" },
              { value: "fulfilled", label: "Fulfilled" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service requests found.</p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  className="w-full rounded-xl border border-white/10 p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.ticketNumber}</p>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">{request.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.serviceItem?.name || "Unknown service"} ·{" "}
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedRequestId}
        onClose={() => {
          setSelectedRequestId(null);
          setApprovalNotes("");
          setRejectReason("");
          setFulfillNotes("");
        }}
        title={requestDetail ? `${requestDetail.ticketNumber} · ${requestDetail.title}` : "Request Details"}
      >
        {detailLoading ? (
          <p className="text-sm text-muted-foreground">Loading request details...</p>
        ) : requestDetail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{requestDetail.status}</Badge>
              <Badge variant="secondary">{requestDetail.serviceItem?.category || "general"}</Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 text-sm">{requestDetail.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Requester</p>
                <p className="mt-1 font-medium">
                  {requestDetail.requester
                    ? `${requestDetail.requester.firstName} ${requestDetail.requester.lastName}`
                    : "Unknown"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 font-medium">{new Date(requestDetail.createdAt).toLocaleString()}</p>
              </div>
              {requestDetail.approvedAt ? (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="mt-1 font-medium">
                    {new Date(requestDetail.approvedAt).toLocaleString()}
                    {requestDetail.approvedBy
                      ? ` · ${requestDetail.approvedBy.firstName} ${requestDetail.approvedBy.lastName}`
                      : ""}
                  </p>
                </div>
              ) : null}
              {requestDetail.deniedAt ? (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Denied</p>
                  <p className="mt-1 font-medium">
                    {new Date(requestDetail.deniedAt).toLocaleString()}
                    {requestDetail.deniedBy
                      ? ` · ${requestDetail.deniedBy.firstName} ${requestDetail.deniedBy.lastName}`
                      : ""}
                  </p>
                  {requestDetail.denialReason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{requestDetail.denialReason}</p>
                  ) : null}
                </div>
              ) : null}
              {requestDetail.fulfilledAt ? (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Fulfilled</p>
                  <p className="mt-1 font-medium">
                    {new Date(requestDetail.fulfilledAt).toLocaleString()}
                    {requestDetail.fulfilledBy
                      ? ` · ${requestDetail.fulfilledBy.firstName} ${requestDetail.fulfilledBy.lastName}`
                      : ""}
                  </p>
                  {requestDetail.fulfillmentNotes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{requestDetail.fulfillmentNotes}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-sm font-medium">Lifecycle History</p>
              <div className="mt-3 space-y-3">
                {(requestDetail.transitions || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No transition history recorded.</p>
                ) : (
                  (requestDetail.transitions || []).map((transition) => (
                    <div key={transition.id} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize">
                          {transition.action.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transition.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {transition.fromStatus ? `${transition.fromStatus} -> ` : ""}
                        {transition.toStatus}
                      </p>
                      {transition.actor ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          By {transition.actor.firstName} {transition.actor.lastName}
                        </p>
                      ) : null}
                      {transition.reason ? (
                        <p className="mt-2 text-xs">Reason: {transition.reason}</p>
                      ) : null}
                      {transition.notes ? (
                        <p className="mt-1 text-xs">Notes: {transition.notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            {requestDetail.status === "requested" ? (
              <div className="space-y-3 rounded-xl border border-white/10 p-3">
                <p className="text-sm font-medium">Approval Actions</p>
                <Textarea
                  label="Approval Notes (optional)"
                  value={approvalNotes}
                  onChange={(event) => setApprovalNotes(event.target.value)}
                  placeholder="Notes to include in transition history"
                />
                <Textarea
                  label="Rejection Reason (optional)"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Reason to include in activity log"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        id: requestDetail.id,
                        action: "approve",
                        payload: { notes: approvalNotes },
                      })
                    }
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        id: requestDetail.id,
                        action: "reject",
                        payload: { reason: rejectReason },
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}

            {requestDetail.status === "approved" ? (
              <div className="space-y-3 rounded-xl border border-white/10 p-3">
                <p className="text-sm font-medium">Fulfillment Action</p>
                <Textarea
                  label="Fulfillment Notes (optional)"
                  value={fulfillNotes}
                  onChange={(event) => setFulfillNotes(event.target.value)}
                  placeholder="Fulfillment notes for activity timeline"
                />
                <Button
                  variant="gradient"
                  disabled={actionMutation.isPending}
                  onClick={() =>
                    actionMutation.mutate({
                      id: requestDetail.id,
                      action: "fulfill",
                      payload: { notes: fulfillNotes },
                    })
                  }
                >
                  Mark as Fulfilled
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
