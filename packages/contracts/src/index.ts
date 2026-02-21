// User & Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  organizationId: string;
  teamIds: string[];
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, unknown>;
}

export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  slaEnabled: boolean;
  defaultSlaHours: number;
  auditRetentionDays: number;
  maxTeamMembers: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Unified Correlation Types
export type SystemEntityType =
  | "incident"
  | "task"
  | "workflow"
  | "policy"
  | "violation"
  | "audit_log"
  | "dashboard_metric"
  | "compliance_check"
  | "compliance_evidence"
  | "report_job"
  | "entity";

export interface SystemTraceContext {
  systemRecordId: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
}

export interface RelatedSystemRecord {
  type: SystemEntityType | string;
  id: string;
  systemRecordId: string;
  relationship?: string;
}

export interface CorrelatedRecord {
  systemRecordId: string;
  traceContext?: SystemTraceContext;
  relatedRecords?: RelatedSystemRecord[];
}

// Incident Types
export type IncidentStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed"
  | "escalated";

export type IncidentPriority = "critical" | "high" | "medium" | "low";

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  organizationId: string;
  teamId?: string;
  assigneeId?: string;
  reporterId: string;
  tags: string[];
  dueAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  action: string;
  actorId?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Workflow Types
export type WorkflowStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Workflow extends CorrelatedRecord {
  id: string;
  name: string;
  type: WorkflowType;
  status: WorkflowStatus;
  entityId: string;
  entityType: string;
  currentStepId?: string;
  steps: WorkflowStep[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type WorkflowType = "incident_approval" | "policy_review" | "report_generation";

export interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  status: WorkflowStepStatus;
  assigneeId?: string;
  assigneeRoleId?: string;
  completedAt?: Date;
  notes?: string;
}

export type WorkflowStepStatus = "pending" | "in_progress" | "completed" | "skipped" | "rejected";

// Task Types
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface Task extends CorrelatedRecord {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  organizationId: string;
  assigneeId?: string;
  reporterId?: string;
  incidentId?: string;
  workflowId?: string;
  violationId?: string;
  policyId?: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  teamId?: string;
  dueAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Policy & Compliance Types
export type PolicyStatus = "draft" | "active" | "deprecated" | "archived";

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: string;
  status: PolicyStatus;
  version: string;
  organizationId: string;
  ownerRoleId: string;
  reviewFrequencyDays: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ViolationStatus = "open" | "acknowledged" | "remediated" | "false_positive" | "wont_fix";

export type ViolationSeverity = "critical" | "high" | "medium" | "low";

export interface Violation extends CorrelatedRecord {
  id: string;
  policyId: string;
  entityId: string;
  entityType: string;
  status: ViolationStatus;
  severity: ViolationSeverity;
  title: string;
  description: string;
  remediation?: string;
  assigneeId?: string;
  organizationId: string;
  detectedAt: Date;
  acknowledgedAt?: Date;
  remediatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Types
export interface AuditLog extends CorrelatedRecord {
  id: string;
  organizationId: string;
  actorId?: string;
  actorType: "user" | "system" | "integration";
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
  createdAt: Date;
}

// Report Types
export type ReportJobStatus = "pending" | "processing" | "completed" | "failed";

export type ReportFormat = "csv" | "pdf" | "xlsx";

export interface ReportJob {
  id: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportJobStatus;
  parameters: Record<string, unknown>;
  organizationId: string;
  requestedById: string;
  downloadUrl?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export type ReportType =
  | "incident_summary"
  | "compliance_audit"
  | "sla_performance"
  | "user_activity"
  | "policy_violations";

// API Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface DashboardSummary {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  avgResolutionTimeHours: number;
  slaCompliancePercent: number;
  incidentsByStatus: Record<IncidentStatus, number>;
  incidentsByPriority: Record<IncidentPriority, number>;
  trendData: TrendDataPoint[];
  upcomingDeadlines: UpcomingDeadline[];
  crossDomain?: {
    tasks: number;
    workflows: number;
    violations: number;
    auditLogsLast7Days: number;
    linkageCoveragePercent: number;
  };
}

export interface TrendDataPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface UpcomingDeadline {
  id: string;
  type: "incident" | "policy_review" | "report";
  title: string;
  dueAt: Date;
  priority?: IncidentPriority;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type NotificationType =
  | "incident_assigned"
  | "incident_updated"
  | "incident_escalated"
  | "sla_breach_warning"
  | "workflow_action_required"
  | "policy_review_due"
  | "report_ready"
  | "mention";
