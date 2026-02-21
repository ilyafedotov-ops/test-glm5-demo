"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  Settings, Users, Shield, Building, RefreshCw, Plus, Edit, Trash2,
  Check, ChevronRight, Search, Save, AlertTriangle
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isActive: boolean;
  roles: { id: string; name: string }[];
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: { id: string; resource: string; action: string }[];
  userCount?: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  lead?: { id: string; firstName: string; lastName: string; email: string };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
}

interface PrivilegedAccessRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  justification: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
  requestedRoleIds: string[];
  currentRoleIds: string[];
  targetUser: { id: string; firstName: string; lastName: string; email: string };
  requestedBy: { id: string; firstName: string; lastName: string; email: string };
  reviewedBy?: { id: string; firstName: string; lastName: string; email: string };
  requestedRoles: Array<{ id: string; name: string; description?: string }>;
  currentRoles: Array<{ id: string; name: string; description?: string }>;
}

interface CabConfiguration {
  id: string;
  minimumApprovers: number;
  quorumPercent: number;
  emergencyChangeRequiresCab: boolean;
  meetingCadence: string;
  maintenanceWindow?: string;
  members: Array<{
    id: string;
    role: "chair" | "member" | "advisor";
    userId: string;
    user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean };
  }>;
}

async function fetchUsers(token: string): Promise<{ data: User[] }> {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function fetchRoles(token: string): Promise<Role[]> {
  const res = await fetch(`${API_URL}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

async function fetchTeams(token: string): Promise<{ data: Team[] }> {
  const res = await fetch(`${API_URL}/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

async function fetchOrganization(token: string): Promise<Organization> {
  const res = await fetch(`${API_URL}/organizations/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch organization");
  return res.json();
}

// API functions for mutations
async function createUser(token: string, data: any) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create user");
  }
  return res.json();
}

async function updateUser(token: string, id: string, data: any) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

async function createRole(token: string, data: any) {
  const res = await fetch(`${API_URL}/roles`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create role");
  }
  return res.json();
}

async function updateRole(token: string, id: string, data: any) {
  const res = await fetch(`${API_URL}/roles/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update role");
  }
  return res.json();
}

async function deleteRole(token: string, id: string) {
  const res = await fetch(`${API_URL}/roles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete role");
  }
  return res.json();
}

async function fetchPermissions(token: string) {
  const res = await fetch(`${API_URL}/roles/permissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json();
}

async function createTeam(token: string, data: any) {
  const res = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create team");
  }
  return res.json();
}

async function updateOrganization(token: string, data: any) {
  const res = await fetch(`${API_URL}/organizations/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update organization");
  return res.json();
}

async function fetchPrivilegedAccessRequests(token: string): Promise<PrivilegedAccessRequest[]> {
  const res = await fetch(`${API_URL}/admin-governance/privileged-access-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch privileged access requests");
  return res.json();
}

async function createPrivilegedAccessRequest(token: string, data: {
  targetUserId: string;
  requestedRoleIds: string[];
  justification: string;
}) {
  const res = await fetch(`${API_URL}/admin-governance/privileged-access-requests`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to submit privileged access request");
  }
  return res.json();
}

async function reviewPrivilegedAccessRequest(
  token: string,
  requestId: string,
  data: { action: "approve" | "reject"; comment?: string }
) {
  const res = await fetch(`${API_URL}/admin-governance/privileged-access-requests/${requestId}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to review request");
  }
  return res.json();
}

async function fetchCabConfiguration(token: string): Promise<CabConfiguration> {
  const res = await fetch(`${API_URL}/admin-governance/cab`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch CAB configuration");
  return res.json();
}

async function updateCabPolicy(token: string, data: {
  minimumApprovers: number;
  quorumPercent: number;
  emergencyChangeRequiresCab: boolean;
  meetingCadence: string;
  maintenanceWindow?: string;
}) {
  const res = await fetch(`${API_URL}/admin-governance/cab/policy`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update CAB policy");
  }
  return res.json();
}

async function updateCabMembers(token: string, members: Array<{ userId: string; role: "chair" | "member" | "advisor" }>) {
  const res = await fetch(`${API_URL}/admin-governance/cab/members`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update CAB members");
  }
  return res.json();
}

const permissionResources = [
  "incidents", "users", "teams", "policies", "violations", "workflows", "tasks", "reports", "settings"
];

const permissionActions = ["create", "read", "update", "delete", "manage"];

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "teams", label: "Teams", icon: Users },
  { id: "settings", label: "Organization", icon: Building },
  { id: "privileged", label: "Privileged Access", icon: Shield },
  { id: "cab", label: "CAB", icon: Building },
];

export default function AdminPage() {
  const { token, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [createPrivilegedDialogOpen, setCreatePrivilegedDialogOpen] = useState(false);
  const [selectedPrivilegedRequest, setSelectedPrivilegedRequest] = useState<PrivilegedAccessRequest | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "", roleIds: [] as string[] });
  const [newRole, setNewRole] = useState({ name: "", description: "", permissionIds: [] as string[] });
  const [editRoleForm, setEditRoleForm] = useState({ name: "", description: "", permissionIds: [] as string[] });
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    leadId: "",
    memberIds: [] as string[],
  });
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", isActive: true });
  const [newPrivilegedRequest, setNewPrivilegedRequest] = useState({
    targetUserId: "",
    requestedRoleIds: [] as string[],
    justification: "",
  });
  const [cabPolicyForm, setCabPolicyForm] = useState({
    minimumApprovers: 2,
    quorumPercent: 60,
    emergencyChangeRequiresCab: true,
    meetingCadence: "weekly",
    maintenanceWindow: "Sun 00:00-04:00 UTC",
  });
  const [cabMembersForm, setCabMembersForm] = useState<Record<string, "chair" | "member" | "advisor">>({});
  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    defaultIncidentPriority: "medium",
    slaBreachNotifications: true,
    requireTwoFactor: false,
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(token!),
    enabled: isAuthenticated && !!token && ["users", "teams", "privileged", "cab"].includes(activeTab),
  });

  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => fetchRoles(token!),
    enabled: isAuthenticated && !!token && ["roles", "privileged"].includes(activeTab),
  });

  const { data: permissions } = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: () => fetchPermissions(token!),
    enabled: isAuthenticated && !!token && ["roles"].includes(activeTab),
  });

  const { data: teamsData, isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: () => fetchTeams(token!),
    enabled: isAuthenticated && !!token && activeTab === "teams",
  });

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: () => fetchOrganization(token!),
    enabled: isAuthenticated && !!token && activeTab === "settings",
  });

  const { data: privilegedRequests = [], isLoading: privilegedLoading } = useQuery({
    queryKey: ["admin", "privileged-access-requests"],
    queryFn: () => fetchPrivilegedAccessRequests(token!),
    enabled: isAuthenticated && !!token && activeTab === "privileged",
  });

  const { data: cabConfiguration, isLoading: cabLoading } = useQuery({
    queryKey: ["admin", "cab-configuration"],
    queryFn: () => fetchCabConfiguration(token!),
    enabled: isAuthenticated && !!token && activeTab === "cab",
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => createUser(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreateUserDialogOpen(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", roleIds: [] });
      addToast({ type: "success", title: "User created", description: "The user has been invited successfully." });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to create user", description: err.message });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      addToast({ type: "success", title: "User updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update user", description: err.message });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: any) => createRole(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      setCreateRoleDialogOpen(false);
      setNewRole({ name: "", description: "", permissionIds: [] });
      addToast({ type: "success", title: "Role created" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to create role", description: err.message });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      setEditRoleDialogOpen(false);
      setSelectedRole(null);
      addToast({ type: "success", title: "Role updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update role", description: err.message });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => deleteRole(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      setDeleteRoleDialogOpen(false);
      setSelectedRole(null);
      addToast({ type: "success", title: "Role deleted" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to delete role", description: err.message });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => createTeam(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      setCreateTeamDialogOpen(false);
      setNewTeam({ name: "", description: "", leadId: "", memberIds: [] });
      addToast({ type: "success", title: "Team created" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to create team", description: err.message });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: any) => updateOrganization(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organization"] });
      addToast({ type: "success", title: "Organization updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update organization", description: err.message });
    },
  });

  const createPrivilegedRequestMutation = useMutation({
    mutationFn: (data: { targetUserId: string; requestedRoleIds: string[]; justification: string }) =>
      createPrivilegedAccessRequest(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "privileged-access-requests"] });
      setCreatePrivilegedDialogOpen(false);
      setNewPrivilegedRequest({
        targetUserId: "",
        requestedRoleIds: [],
        justification: "",
      });
      addToast({ type: "success", title: "Request submitted" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to submit request", description: err.message });
    },
  });

  const reviewPrivilegedRequestMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
      comment,
    }: {
      requestId: string;
      action: "approve" | "reject";
      comment?: string;
    }) => reviewPrivilegedAccessRequest(token!, requestId, { action, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "privileged-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedPrivilegedRequest(null);
      setReviewComment("");
      addToast({ type: "success", title: "Request reviewed" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to review request", description: err.message });
    },
  });

  const updateCabPolicyMutation = useMutation({
    mutationFn: () => updateCabPolicy(token!, cabPolicyForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cab-configuration"] });
      addToast({ type: "success", title: "CAB policy updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update CAB policy", description: err.message });
    },
  });

  const updateCabMembersMutation = useMutation({
    mutationFn: () =>
      updateCabMembers(
        token!,
        Object.entries(cabMembersForm).map(([userId, role]) => ({ userId, role }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cab-configuration"] });
      addToast({ type: "success", title: "CAB members updated" });
    },
    onError: (err: Error) => {
      addToast({ type: "error", title: "Failed to update CAB members", description: err.message });
    },
  });

  useEffect(() => {
    if (!organization) return;

    setOrganizationForm({
      name: organization.name || "",
      defaultIncidentPriority:
        typeof organization.settings?.["defaultIncidentPriority"] === "string"
          ? organization.settings["defaultIncidentPriority"]
          : "medium",
      slaBreachNotifications:
        typeof organization.settings?.["slaBreachNotifications"] === "boolean"
          ? organization.settings["slaBreachNotifications"]
          : true,
      requireTwoFactor:
        typeof organization.settings?.["requireTwoFactor"] === "boolean"
          ? organization.settings["requireTwoFactor"]
          : false,
    });
  }, [organization]);

  useEffect(() => {
    if (!cabConfiguration) return;

    setCabPolicyForm({
      minimumApprovers: cabConfiguration.minimumApprovers,
      quorumPercent: cabConfiguration.quorumPercent,
      emergencyChangeRequiresCab: cabConfiguration.emergencyChangeRequiresCab,
      meetingCadence: cabConfiguration.meetingCadence,
      maintenanceWindow: cabConfiguration.maintenanceWindow || "",
    });

    setCabMembersForm(
      cabConfiguration.members.reduce<Record<string, "chair" | "member" | "advisor">>((acc, member) => {
        acc[member.userId] = member.role;
        return acc;
      }, {})
    );
  }, [cabConfiguration]);

  if (!isAuthenticated) return null;

  const isAdminUser =
    !!user &&
    (user.roles?.some((role) => role.name === "admin") ||
      user.permissions?.some((permission) => permission.name === "admin:all"));

  if (!isAdminUser) {
    return (
      <div className="p-8">
        <Card variant="glass">
          <CardContent className="p-10 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
            <p className="text-lg font-semibold">Admin access required</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your account does not have permission to access the admin console.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = usersData?.data || [];
  const teams = teamsData?.data || [];

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, permissions, and organization settings
          </p>
        </div>
        <Button
          variant="glass"
          onClick={() => {
            refetchUsers();
            refetchRoles();
            refetchTeams();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-muted/50 animate-slide-up">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <Button variant="gradient" onClick={() => setCreateUserDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </div>

          <Card variant="glass">
            <CardContent className="pt-6">
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl shimmer" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                      onClick={() => { 
                        setSelectedUser(u); 
                        setEditUserForm({ firstName: u.firstName, lastName: u.lastName, isActive: u.isActive });
                        setEditDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                            {u.firstName[0]}{u.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{u.firstName} {u.lastName}</h4>
                            {!u.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {u.roles.slice(0, 2).map(r => (
                            <Badge key={r.id} variant="outline" className="text-xs">{r.name}</Badge>
                          ))}
                          {u.roles.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{u.roles.length - 2}</Badge>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Roles & Permissions</h2>
            <Button variant="gradient" onClick={() => setCreateRoleDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {rolesLoading ? (
              <div className="md:col-span-2 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl shimmer" />)}
              </div>
            ) : roles?.map((role) => (
              <Card key={role.id} variant="glass" className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {role.name}
                      {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                    </CardTitle>
                    {!role.isSystem && (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setEditRoleForm({
                              name: role.name,
                              description: role.description || "",
                              permissionIds: role.permissions.map((p) => p.id),
                            });
                            setEditRoleDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-500"
                          onClick={() => {
                            setSelectedRole(role);
                            setDeleteRoleDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Assigned users: <span className="font-medium text-foreground">{role.userCount || 0}</span>
                    </p>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs capitalize">
                          {p.resource}.{p.action}
                        </Badge>
                      ))}
                      {role.permissions.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permission Matrix */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-medium">Resource</th>
                      {permissionActions.map(action => (
                        <th key={action} className="text-center py-3 px-2 font-medium capitalize">{action}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionResources.map(resource => (
                      <tr key={resource} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 capitalize">{resource}</td>
                        {permissionActions.map(action => (
                          <td key={action} className="text-center py-3 px-2">
                            <button className="h-6 w-6 rounded-md border border-white/20 hover:bg-violet-500 hover:border-violet-500 hover:text-white transition-colors flex items-center justify-center mx-auto">
                              <Check className="h-3 w-3" />
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <Button variant="gradient" onClick={() => setCreateTeamDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamsLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl shimmer" />)
            ) : filteredTeams.map(team => (
              <Card key={team.id} variant="glass" className="group hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{team.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm"><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-rose-500"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                  )}
                  {team.lead && (
                    <div className="mb-3 text-sm text-muted-foreground">
                      Lead: {team.lead.firstName} {team.lead.lastName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.memberCount || 0} members</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {orgLoading ? (
            <div className="h-64 bg-muted/50 rounded-xl shimmer" />
          ) : organization && (
            <>
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Organization Name</label>
                      <Input
                        value={organizationForm.name}
                        onChange={(event) =>
                          setOrganizationForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Slug</label>
                      <Input value={organization.slug} className="mt-1.5" disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <h4 className="font-medium">Default Incident Priority</h4>
                      <p className="text-sm text-muted-foreground">Set the default priority for new incidents</p>
                    </div>
                    <Select
                      value={organizationForm.defaultIncidentPriority}
                      onChange={(event) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          defaultIncidentPriority: event.target.value,
                        }))
                      }
                      options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                        { value: "critical", label: "Critical" },
                      ]}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <h4 className="font-medium">SLA Breach Notifications</h4>
                      <p className="text-sm text-muted-foreground">Send alerts when SLAs are at risk</p>
                    </div>
                    <button
                      onClick={() =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          slaBreachNotifications: !prev.slaBreachNotifications,
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        organizationForm.slaBreachNotifications ? "bg-violet-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          organizationForm.slaBreachNotifications ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <button
                      onClick={() =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          requireTwoFactor: !prev.requireTwoFactor,
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        organizationForm.requireTwoFactor ? "bg-violet-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          organizationForm.requireTwoFactor ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!organization) return;
                    setOrganizationForm({
                      name: organization.name || "",
                      defaultIncidentPriority:
                        typeof organization.settings?.["defaultIncidentPriority"] === "string"
                          ? organization.settings["defaultIncidentPriority"]
                          : "medium",
                      slaBreachNotifications:
                        typeof organization.settings?.["slaBreachNotifications"] === "boolean"
                          ? organization.settings["slaBreachNotifications"]
                          : true,
                      requireTwoFactor:
                        typeof organization.settings?.["requireTwoFactor"] === "boolean"
                          ? organization.settings["requireTwoFactor"]
                          : false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={() =>
                    updateOrgMutation.mutate({
                      name: organizationForm.name,
                      settings: {
                        ...(organization.settings || {}),
                        defaultIncidentPriority: organizationForm.defaultIncidentPriority,
                        slaBreachNotifications: organizationForm.slaBreachNotifications,
                        requireTwoFactor: organizationForm.requireTwoFactor,
                      },
                    })
                  }
                  disabled={updateOrgMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Privileged Access Tab */}
      {activeTab === "privileged" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Privileged Access Approvals</h2>
              <p className="text-sm text-muted-foreground">
                All role-elevation changes require explicit approval.
              </p>
            </div>
            <Button variant="gradient" onClick={() => setCreatePrivilegedDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </div>

          <Card variant="glass">
            <CardContent className="pt-6">
              {privilegedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/50 shimmer" />
                  ))}
                </div>
              ) : privilegedRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No privileged access requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {privilegedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-white/20 bg-white/25 p-4 dark:border-white/10 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {request.targetUser.firstName} {request.targetUser.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested by {request.requestedBy.firstName} {request.requestedBy.lastName} ·{" "}
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "success"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm mt-2">{request.justification}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">Requested Roles:</span>
                        {request.requestedRoles.map((role) => (
                          <Badge key={role.id} variant="outline">{role.name}</Badge>
                        ))}
                      </div>
                      {request.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrivilegedRequest(request);
                              setReviewComment("");
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CAB Tab */}
      {activeTab === "cab" && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div>
            <h2 className="text-xl font-semibold">CAB Governance</h2>
            <p className="text-sm text-muted-foreground">
              Configure advisory board thresholds and maintain CAB membership.
            </p>
          </div>

          {cabLoading ? (
            <div className="h-64 rounded-xl bg-muted/50 shimmer" />
          ) : (
            <>
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">CAB Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Minimum Approvers"
                      type="number"
                      value={String(cabPolicyForm.minimumApprovers)}
                      onChange={(event) =>
                        setCabPolicyForm((prev) => ({
                          ...prev,
                          minimumApprovers: Number(event.target.value) || 1,
                        }))
                      }
                    />
                    <Input
                      label="Quorum Percent"
                      type="number"
                      value={String(cabPolicyForm.quorumPercent)}
                      onChange={(event) =>
                        setCabPolicyForm((prev) => ({
                          ...prev,
                          quorumPercent: Number(event.target.value) || 1,
                        }))
                      }
                    />
                    <Input
                      label="Meeting Cadence"
                      value={cabPolicyForm.meetingCadence}
                      onChange={(event) =>
                        setCabPolicyForm((prev) => ({
                          ...prev,
                          meetingCadence: event.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Maintenance Window"
                      value={cabPolicyForm.maintenanceWindow}
                      onChange={(event) =>
                        setCabPolicyForm((prev) => ({
                          ...prev,
                          maintenanceWindow: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                    <div>
                      <p className="font-medium">Emergency Changes Require CAB</p>
                      <p className="text-sm text-muted-foreground">Block emergency change approvals without CAB votes.</p>
                    </div>
                    <button
                      onClick={() =>
                        setCabPolicyForm((prev) => ({
                          ...prev,
                          emergencyChangeRequiresCab: !prev.emergencyChangeRequiresCab,
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        cabPolicyForm.emergencyChangeRequiresCab ? "bg-violet-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          cabPolicyForm.emergencyChangeRequiresCab ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="gradient"
                      onClick={() => updateCabPolicyMutation.mutate()}
                      disabled={updateCabPolicyMutation.isPending}
                    >
                      {updateCabPolicyMutation.isPending ? "Saving..." : "Save CAB Policy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">CAB Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users available for CAB membership.</p>
                  ) : (
                    users.map((u) => {
                      const selectedRole = cabMembersForm[u.id];
                      const isSelected = !!selectedRole;
                      return (
                        <div key={u.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                          <div>
                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                isSelected ? "bg-violet-500 text-white" : "bg-muted"
                              }`}
                              onClick={() =>
                                setCabMembersForm((prev) => {
                                  const next = { ...prev };
                                  if (next[u.id]) {
                                    delete next[u.id];
                                  } else {
                                    next[u.id] = "member";
                                  }
                                  return next;
                                })
                              }
                            >
                              {isSelected ? "Included" : "Include"}
                            </button>
                            <Select
                              value={selectedRole || "member"}
                              onChange={(event) =>
                                setCabMembersForm((prev) => ({
                                  ...prev,
                                  [u.id]: event.target.value as "chair" | "member" | "advisor",
                                }))
                              }
                              options={[
                                { value: "chair", label: "Chair" },
                                { value: "member", label: "Member" },
                                { value: "advisor", label: "Advisor" },
                              ]}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="gradient"
                      onClick={() => updateCabMembersMutation.mutate()}
                      disabled={updateCabMembersMutation.isPending}
                    >
                      {updateCabMembersMutation.isPending ? "Saving..." : "Save CAB Members"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        title="Invite New User"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="john@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="••••••••"
          />
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Assign Roles (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {roles?.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    const roleIds = newUser.roleIds.includes(role.id)
                      ? newUser.roleIds.filter((id) => id !== role.id)
                      : [...newUser.roleIds, role.id];
                    setNewUser({ ...newUser, roleIds });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    newUser.roleIds.includes(role.id)
                      ? "bg-violet-500 text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setCreateUserDialogOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              onClick={() => createUserMutation.mutate(newUser)}
              disabled={!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog
        open={createRoleDialogOpen}
        onClose={() => setCreateRoleDialogOpen(false)}
        title="Create New Role"
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Role Name"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
            placeholder="e.g., Content Manager"
          />
          <Input
            label="Description"
            value={newRole.description || ""}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            placeholder="Brief description of this role"
          />
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Permissions (Optional)</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-lg border border-white/10">
              {permissions?.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    const permissionIds = newRole.permissionIds.includes(p.id)
                      ? newRole.permissionIds.filter((id) => id !== p.id)
                      : [...newRole.permissionIds, p.id];
                    setNewRole({ ...newRole, permissionIds });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    newRole.permissionIds.includes(p.id)
                      ? "bg-violet-500 text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {p.resource}.{p.action}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setCreateRoleDialogOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              onClick={() => createRoleMutation.mutate(newRole)}
              disabled={!newRole.name || createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={editRoleDialogOpen}
        onClose={() => { setEditRoleDialogOpen(false); setSelectedRole(null); }}
        title="Edit Role"
      >
        {selectedRole && (
          <div className="space-y-6">
            <Input
              label="Role Name"
              value={editRoleForm.name}
              onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
              placeholder="e.g., Content Manager"
            />
            <Input
              label="Description"
              value={editRoleForm.description}
              onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
              placeholder="Brief description of this role"
            />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Permissions</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-lg border border-white/10">
                {permissions?.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const permissionIds = editRoleForm.permissionIds.includes(p.id)
                        ? editRoleForm.permissionIds.filter((id) => id !== p.id)
                        : [...editRoleForm.permissionIds, p.id];
                      setEditRoleForm({ ...editRoleForm, permissionIds });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editRoleForm.permissionIds.includes(p.id)
                        ? "bg-violet-500 text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {p.resource}.{p.action}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
              <Button
                variant="gradient"
                onClick={() => updateRoleMutation.mutate({ id: selectedRole.id, data: editRoleForm })}
                disabled={!editRoleForm.name || updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog
        open={deleteRoleDialogOpen}
        onClose={() => { setDeleteRoleDialogOpen(false); setSelectedRole(null); }}
        title="Delete Role"
      >
        {selectedRole && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
              <div>
                <h4 className="font-semibold">Are you sure?</h4>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the role &quot;{selectedRole.name}&quot;. This action cannot be undone.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Affected users: <span className="font-medium text-foreground">{selectedRole.userCount || 0}</span>
                </p>
              </div>
            </div>
            {(selectedRole.userCount || 0) > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                This role is assigned to active users. Reassign those users before deleting.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteRoleDialogOpen(false)}>Cancel</Button>
              <Button
                variant="gradient"
                className="bg-rose-500 hover:bg-rose-600"
                onClick={() => deleteRoleMutation.mutate(selectedRole.id)}
                disabled={deleteRoleMutation.isPending || (selectedRole.userCount || 0) > 0}
              >
                {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog
        open={createTeamDialogOpen}
        onClose={() => setCreateTeamDialogOpen(false)}
        title="Create New Team"
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Team Name"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="e.g., Design Team"
          />
          <Input
            label="Description"
            value={newTeam.description || ""}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
            placeholder="Brief description of this team"
          />
          <Select
            label="Team Lead"
            value={newTeam.leadId}
            onChange={(event) =>
              setNewTeam((prev) => ({
                ...prev,
                leadId: event.target.value,
              }))
            }
            options={[
              { value: "", label: "No lead assigned" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.email})`,
              })),
            ]}
          />
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Initial Members</label>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-white/10 p-2">
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() =>
                      setNewTeam((prev) => {
                        const selected = prev.memberIds.includes(u.id);
                        return {
                          ...prev,
                          memberIds: selected
                            ? prev.memberIds.filter((id) => id !== u.id)
                            : [...prev.memberIds, u.id],
                        };
                      })
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      newTeam.memberIds.includes(u.id)
                        ? "bg-violet-500 text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {u.firstName} {u.lastName}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setCreateTeamDialogOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              onClick={() =>
                createTeamMutation.mutate({
                  ...newTeam,
                  leadId: newTeam.leadId || undefined,
                })
              }
              disabled={!newTeam.name || createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setSelectedUser(null); }}
        title={selectedUser ? `Edit User: ${selectedUser.firstName} ${selectedUser.lastName}` : "Edit User"}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Input
                label="First Name"
                value={editUserForm.firstName}
                onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={editUserForm.lastName}
                onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
              />
              <Input label="Email" value={selectedUser.email} type="email" disabled />
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="ghost" className="text-rose-500">
                <AlertTriangle className="h-4 w-4" />
                {selectedUser.isActive ? "Deactivate User" : "Activate User"}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="gradient"
                  onClick={() => updateUserMutation.mutate({
                    id: selectedUser.id,
                    data: editUserForm
                  })}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={createPrivilegedDialogOpen}
        onClose={() => setCreatePrivilegedDialogOpen(false)}
        title="New Privileged Access Request"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Target User"
            value={newPrivilegedRequest.targetUserId}
            onChange={(event) =>
              setNewPrivilegedRequest((prev) => ({
                ...prev,
                targetUserId: event.target.value,
              }))
            }
            options={[
              { value: "", label: "Select a user" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.email})`,
              })),
            ]}
          />
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Requested Roles</label>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
              {roles?.map((role) => (
                <button
                  key={role.id}
                  onClick={() =>
                    setNewPrivilegedRequest((prev) => {
                      const requestedRoleIds = prev.requestedRoleIds.includes(role.id)
                        ? prev.requestedRoleIds.filter((id) => id !== role.id)
                        : [...prev.requestedRoleIds, role.id];
                      return { ...prev, requestedRoleIds };
                    })
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    newPrivilegedRequest.requestedRoleIds.includes(role.id)
                      ? "bg-violet-500 text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Justification"
            rows={4}
            value={newPrivilegedRequest.justification}
            onChange={(event) =>
              setNewPrivilegedRequest((prev) => ({
                ...prev,
                justification: event.target.value,
              }))
            }
            placeholder="Explain why elevated access is required and for how long."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreatePrivilegedDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => createPrivilegedRequestMutation.mutate(newPrivilegedRequest)}
              disabled={
                createPrivilegedRequestMutation.isPending ||
                !newPrivilegedRequest.targetUserId ||
                newPrivilegedRequest.requestedRoleIds.length === 0 ||
                !newPrivilegedRequest.justification.trim()
              }
            >
              {createPrivilegedRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!selectedPrivilegedRequest}
        onClose={() => setSelectedPrivilegedRequest(null)}
        title="Review Privileged Access Request"
      >
        {selectedPrivilegedRequest && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                {selectedPrivilegedRequest.targetUser.firstName} {selectedPrivilegedRequest.targetUser.lastName}
              </p>
              <p className="mt-1 text-muted-foreground">{selectedPrivilegedRequest.justification}</p>
            </div>
            <Textarea
              label="Review Comment"
              rows={3}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Optional comment for approval or rejection."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedPrivilegedRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  reviewPrivilegedRequestMutation.mutate({
                    requestId: selectedPrivilegedRequest.id,
                    action: "reject",
                    comment: reviewComment || undefined,
                  })
                }
                disabled={reviewPrivilegedRequestMutation.isPending}
              >
                Reject
              </Button>
              <Button
                variant="gradient"
                onClick={() =>
                  reviewPrivilegedRequestMutation.mutate({
                    requestId: selectedPrivilegedRequest.id,
                    action: "approve",
                    comment: reviewComment || undefined,
                  })
                }
                disabled={reviewPrivilegedRequestMutation.isPending}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
