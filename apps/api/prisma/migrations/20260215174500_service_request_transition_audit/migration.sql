-- Add service request transition audit fields
ALTER TABLE "ServiceRequest"
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "deniedById" TEXT,
  ADD COLUMN "fulfilledById" TEXT,
  ADD COLUMN "lastTransitionById" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "deniedAt" TIMESTAMP(3),
  ADD COLUMN "denialReason" TEXT,
  ADD COLUMN "fulfillmentNotes" TEXT,
  ADD COLUMN "lastTransitionAt" TIMESTAMP(3);

-- Create request transition history table
CREATE TABLE "ServiceRequestTransition" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceRequestTransition_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ServiceRequest_approvedById_idx" ON "ServiceRequest"("approvedById");
CREATE INDEX "ServiceRequest_deniedById_idx" ON "ServiceRequest"("deniedById");
CREATE INDEX "ServiceRequest_fulfilledById_idx" ON "ServiceRequest"("fulfilledById");
CREATE INDEX "ServiceRequest_lastTransitionById_idx" ON "ServiceRequest"("lastTransitionById");
CREATE INDEX "ServiceRequestTransition_serviceRequestId_idx" ON "ServiceRequestTransition"("serviceRequestId");
CREATE INDEX "ServiceRequestTransition_organizationId_idx" ON "ServiceRequestTransition"("organizationId");
CREATE INDEX "ServiceRequestTransition_action_idx" ON "ServiceRequestTransition"("action");
CREATE INDEX "ServiceRequestTransition_createdAt_idx" ON "ServiceRequestTransition"("createdAt");

-- Foreign keys
ALTER TABLE "ServiceRequest"
  ADD CONSTRAINT "ServiceRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceRequest_deniedById_fkey" FOREIGN KEY ("deniedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceRequest_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceRequest_lastTransitionById_fkey" FOREIGN KEY ("lastTransitionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceRequestTransition"
  ADD CONSTRAINT "ServiceRequestTransition_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceRequestTransition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceRequestTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
