"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { ShoppingCart, Search, Package, Monitor, Key, FileText, ChevronRight, Check, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";

interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  approvalRequired: boolean;
  _count?: { serviceRequests: number };
}

interface ServiceRequest {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: "requested" | "approved" | "denied" | "fulfilled" | "closed";
  createdAt: string;
  serviceItem?: {
    id: string;
    name: string;
    category: string;
  };
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ServiceRequestsResponse {
  data: ServiceRequest[];
}

async function fetchServiceItems(token: string): Promise<ServiceCatalogItem[]> {
  const res = await fetch(`${API_URL}/service-catalog/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch service items");
  const payload = await res.json();
  if (Array.isArray(payload)) return payload;
  return payload.data || [];
}

async function fetchServiceRequests(token: string): Promise<ServiceRequestsResponse> {
  const res = await fetch(`${API_URL}/service-catalog/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch service requests");
  return res.json();
}

async function createServiceRequest(
  token: string,
  payload: { serviceItemId: string; title: string; description: string }
) {
  const res = await fetch(`${API_URL}/service-catalog/requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      formData: {},
    }),
  });
  if (!res.ok) throw new Error("Failed to submit service request");
  return res.json();
}

async function transitionServiceRequest(
  token: string,
  requestId: string,
  action: "approve" | "reject" | "fulfill",
  reason?: string
) {
  const res = await fetch(`${API_URL}/service-catalog/requests/${requestId}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(action === "reject" ? { reason } : {}),
  });
  if (!res.ok) throw new Error(`Failed to ${action} request`);
  return res.json();
}

const categoryConfig: Record<string, { icon: any; color: string }> = {
  hardware: { icon: Monitor, color: "from-blue-500 to-blue-600" },
  software: { icon: Package, color: "from-purple-500 to-purple-600" },
  access: { icon: Key, color: "from-emerald-500 to-emerald-600" },
  general: { icon: FileText, color: "from-amber-500 to-amber-600" },
};

export default function ServiceCatalogPage() {
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceCatalogItem | null>(null);
  const [requestDescription, setRequestDescription] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["service-catalog-items"],
    queryFn: () => fetchServiceItems(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["service-catalog-requests"],
    queryFn: () => fetchServiceRequests(token!),
    enabled: isAuthenticated && !!token,
  });

  const createRequestMutation = useMutation({
    mutationFn: (payload: { serviceItemId: string; title: string; description: string }) =>
      createServiceRequest(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-catalog-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-catalog-items"] });
      setRequestDialogOpen(false);
      setRequestDescription("");
      addToast({
        type: "success",
        title: "Request submitted",
        description: "Service request created successfully.",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Submission failed",
        description: error.message,
      });
    },
  });

  const requestActionMutation = useMutation({
    mutationFn: (params: { requestId: string; action: "approve" | "reject" | "fulfill"; reason?: string }) =>
      transitionServiceRequest(token!, params.requestId, params.action, params.reason),
    onSuccess: (_data, variables) => {
      const pastTense: Record<"approve" | "reject" | "fulfill", string> = {
        approve: "approved",
        reject: "rejected",
        fulfill: "fulfilled",
      };
      queryClient.invalidateQueries({ queryKey: ["service-catalog-requests"] });
      addToast({
        type: "success",
        title: "Request updated",
        description: `Request ${pastTense[variables.action]} successfully.`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Action failed",
        description: error.message,
      });
    },
  });

  const filteredItems = items?.filter((item) => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const categories = [...new Set(items?.map((item) => item.category) || [])];
  const recentRequests = requestsData?.data?.slice(0, 8) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Request IT services and products
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/catalog/requests">Open Request Inbox</Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => {
                const config = categoryConfig[cat] || categoryConfig["general"];
                const Icon = config.icon;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {cat}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const config = categoryConfig[item.category] || categoryConfig["general"];
            const Icon = config.icon;

            return (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setRequestDialogOpen(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {item.approvalRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Approval Required
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.category}
                    </span>
                    <Button variant="ghost" size="sm" className="group-hover:text-primary">
                      Request
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No services found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term" : "Check back later for available services"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Request Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => {
          setRequestDialogOpen(false);
          setRequestDescription("");
        }}
        title={`Request: ${selectedItem?.name || ""}`}
      >
        {selectedItem && (
          <div className="p-6 space-y-4">
            <p className="text-muted-foreground">{selectedItem.description}</p>
            {selectedItem.approvalRequired && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600">
                  This request requires manager approval
                </p>
              </div>
            )}
            <div className="space-y-3">
              <textarea
                placeholder="Add any additional details or justification..."
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                className="w-full p-3 rounded-lg border border-white/20 bg-white/50 dark:bg-slate-900/50 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                disabled={createRequestMutation.isPending}
                onClick={() =>
                  createRequestMutation.mutate({
                    serviceItemId: selectedItem.id,
                    title: `Request for ${selectedItem.name}`,
                    description: requestDescription.trim() || `Request submitted for ${selectedItem.name}`,
                  })
                }
              >
                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Recent Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const canActOnRequest = request.status === "requested" || request.status === "approved";
                return (
                  <div
                    key={request.id}
                    className="rounded-lg border border-white/10 p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.ticketNumber}</p>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="text-sm mt-1">{request.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.serviceItem?.name || "Service Item"} ·{" "}
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {canActOnRequest && (
                      <div className="flex gap-2">
                        {request.status === "requested" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={requestActionMutation.isPending}
                              onClick={() =>
                                requestActionMutation.mutate({
                                  requestId: request.id,
                                  action: "approve",
                                })
                              }
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={requestActionMutation.isPending}
                              onClick={() => {
                                const reason = window.prompt("Rejection reason (optional):") || "";
                                requestActionMutation.mutate({
                                  requestId: request.id,
                                  action: "reject",
                                  reason,
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === "approved" && (
                          <Button
                            size="sm"
                            variant="gradient"
                            disabled={requestActionMutation.isPending}
                            onClick={() =>
                              requestActionMutation.mutate({
                                requestId: request.id,
                                action: "fulfill",
                              })
                            }
                          >
                            Fulfill
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
