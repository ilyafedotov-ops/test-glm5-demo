-- Create foundational ITIL/helpdesk tables that later migrations depend on.

-- CreateTable
CREATE TABLE "IncidentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "responseTimeMins" INTEGER NOT NULL,
    "resolutionTimeMins" INTEGER NOT NULL,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCounter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "problemCount" INTEGER NOT NULL DEFAULT 0,
    "changeCount" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCounter_pkey" PRIMARY KEY ("id")
);

-- Extend Incident with ITIL linking fields expected by API/schema.
ALTER TABLE "Incident"
  ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "impact" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "urgency" TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "slaPolicyId" TEXT,
  ADD COLUMN IF NOT EXISTS "slaResponseDue" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "slaResolutionDue" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "slaResponseAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "slaResponseMet" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "slaResolutionMet" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'portal',
  ADD COLUMN IF NOT EXISTS "onHoldReason" TEXT,
  ADD COLUMN IF NOT EXISTS "onHoldUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "problemId" TEXT,
  ADD COLUMN IF NOT EXISTS "changeRequestId" TEXT;

ALTER TABLE "Incident"
  ALTER COLUMN "reporterId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "rootCause" TEXT,
    "workaround" TEXT,
    "impactAssessment" TEXT,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "priority" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "teamId" TEXT,
    "isKnownError" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "rollbackPlan" TEXT,
    "testPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeApproval" (
    "id" TEXT NOT NULL,
    "changeRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "formSchema" JSONB,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvalWorkflow" TEXT,
    "slaPolicyId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "formData" JSONB,
    "serviceItemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "tags" TEXT[] NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "organizationId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "reporterId" TEXT,
    "incidentId" TEXT,
    "workflowId" TEXT,
    "violationId" TEXT,
    "policyId" TEXT,
    "problemId" TEXT,
    "changeRequestId" TEXT,
    "teamId" TEXT,
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "tags" TEXT[] NOT NULL,
    "metadata" JSONB,
    "sourceEntityId" TEXT,
    "sourceEntityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "policyId" TEXT,
    "violationId" TEXT,
    "taskId" TEXT,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "content" JSONB,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "policyId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "status" TEXT NOT NULL,
    "score" INTEGER,
    "findings" JSONB NOT NULL DEFAULT '[]',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardMetric" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "emailIncidentAssigned" BOOLEAN NOT NULL DEFAULT true,
    "emailIncidentResolved" BOOLEAN NOT NULL DEFAULT true,
    "emailSlaBreached" BOOLEAN NOT NULL DEFAULT true,
    "emailChangeApproved" BOOLEAN NOT NULL DEFAULT true,
    "emailDailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "inAppAll" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncidentCategory_organizationId_idx" ON "IncidentCategory"("organizationId");
CREATE INDEX "IncidentCategory_parentId_idx" ON "IncidentCategory"("parentId");

CREATE INDEX "SLAPolicy_organizationId_idx" ON "SLAPolicy"("organizationId");
CREATE INDEX "SLAPolicy_priority_idx" ON "SLAPolicy"("priority");

CREATE UNIQUE INDEX "TicketCounter_organizationId_key" ON "TicketCounter"("organizationId");

CREATE UNIQUE INDEX "Incident_ticketNumber_key" ON "Incident"("ticketNumber");
CREATE INDEX "Incident_categoryId_idx" ON "Incident"("categoryId");
CREATE INDEX "Incident_problemId_idx" ON "Incident"("problemId");
CREATE INDEX "Incident_changeRequestId_idx" ON "Incident"("changeRequestId");

CREATE UNIQUE INDEX "Problem_ticketNumber_key" ON "Problem"("ticketNumber");
CREATE INDEX "Problem_organizationId_idx" ON "Problem"("organizationId");
CREATE INDEX "Problem_status_idx" ON "Problem"("status");
CREATE INDEX "Problem_ticketNumber_idx" ON "Problem"("ticketNumber");
CREATE INDEX "Problem_assigneeId_idx" ON "Problem"("assigneeId");

CREATE UNIQUE INDEX "ChangeRequest_ticketNumber_key" ON "ChangeRequest"("ticketNumber");
CREATE INDEX "ChangeRequest_organizationId_idx" ON "ChangeRequest"("organizationId");
CREATE INDEX "ChangeRequest_status_idx" ON "ChangeRequest"("status");
CREATE INDEX "ChangeRequest_ticketNumber_idx" ON "ChangeRequest"("ticketNumber");
CREATE INDEX "ChangeRequest_type_idx" ON "ChangeRequest"("type");

CREATE UNIQUE INDEX "ChangeApproval_changeRequestId_approverId_key" ON "ChangeApproval"("changeRequestId", "approverId");
CREATE INDEX "ChangeApproval_changeRequestId_idx" ON "ChangeApproval"("changeRequestId");

CREATE INDEX "ServiceCatalogItem_organizationId_idx" ON "ServiceCatalogItem"("organizationId");
CREATE INDEX "ServiceCatalogItem_category_idx" ON "ServiceCatalogItem"("category");
CREATE INDEX "ServiceCatalogItem_status_idx" ON "ServiceCatalogItem"("status");

CREATE UNIQUE INDEX "ServiceRequest_ticketNumber_key" ON "ServiceRequest"("ticketNumber");
CREATE INDEX "ServiceRequest_organizationId_idx" ON "ServiceRequest"("organizationId");
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
CREATE INDEX "ServiceRequest_ticketNumber_idx" ON "ServiceRequest"("ticketNumber");

CREATE INDEX "KnowledgeArticle_organizationId_idx" ON "KnowledgeArticle"("organizationId");
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");
CREATE INDEX "KnowledgeArticle_status_idx" ON "KnowledgeArticle"("status");

CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_teamId_idx" ON "Task"("teamId");
CREATE INDEX "Task_incidentId_idx" ON "Task"("incidentId");
CREATE INDEX "Task_violationId_idx" ON "Task"("violationId");
CREATE INDEX "Task_policyId_idx" ON "Task"("policyId");
CREATE INDEX "Task_workflowId_idx" ON "Task"("workflowId");
CREATE INDEX "Task_problemId_idx" ON "Task"("problemId");
CREATE INDEX "Task_changeRequestId_idx" ON "Task"("changeRequestId");
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");
CREATE INDEX "Task_sourceEntityType_sourceEntityId_idx" ON "Task"("sourceEntityType", "sourceEntityId");

CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");
CREATE INDEX "Activity_actorId_idx" ON "Activity"("actorId");
CREATE INDEX "Activity_action_idx" ON "Activity"("action");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

CREATE INDEX "ComplianceEvidence_organizationId_idx" ON "ComplianceEvidence"("organizationId");
CREATE INDEX "ComplianceEvidence_policyId_idx" ON "ComplianceEvidence"("policyId");
CREATE INDEX "ComplianceEvidence_violationId_idx" ON "ComplianceEvidence"("violationId");
CREATE INDEX "ComplianceEvidence_taskId_idx" ON "ComplianceEvidence"("taskId");

CREATE INDEX "ComplianceCheck_organizationId_idx" ON "ComplianceCheck"("organizationId");
CREATE INDEX "ComplianceCheck_policyId_idx" ON "ComplianceCheck"("policyId");
CREATE INDEX "ComplianceCheck_status_idx" ON "ComplianceCheck"("status");
CREATE INDEX "ComplianceCheck_entityType_entityId_idx" ON "ComplianceCheck"("entityType", "entityId");

CREATE UNIQUE INDEX "DashboardMetric_organizationId_metricType_period_computedAt_key" ON "DashboardMetric"("organizationId", "metricType", "period", "computedAt");
CREATE INDEX "DashboardMetric_organizationId_idx" ON "DashboardMetric"("organizationId");
CREATE INDEX "DashboardMetric_metricType_idx" ON "DashboardMetric"("metricType");

CREATE INDEX "Webhook_organizationId_idx" ON "Webhook"("organizationId");
CREATE INDEX "Webhook_isActive_idx" ON "Webhook"("isActive");

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "IncidentCategory" ADD CONSTRAINT "IncidentCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "IncidentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentCategory" ADD CONSTRAINT "IncidentCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SLAPolicy" ADD CONSTRAINT "SLAPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketCounter" ADD CONSTRAINT "TicketCounter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Incident" ADD CONSTRAINT "Incident_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IncidentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_slaPolicyId_fkey" FOREIGN KEY ("slaPolicyId") REFERENCES "SLAPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Problem" ADD CONSTRAINT "Problem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChangeApproval" ADD CONSTRAINT "ChangeApproval_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeApproval" ADD CONSTRAINT "ChangeApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceCatalogItem" ADD CONSTRAINT "ServiceCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "ChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DashboardMetric" ADD CONSTRAINT "DashboardMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
