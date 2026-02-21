-- Add tenant scope to workflows for strict organization isolation
ALTER TABLE "Workflow"
ADD COLUMN "organizationId" TEXT;

-- Backfill from linked incident where available
UPDATE "Workflow" w
SET "organizationId" = i."organizationId"
FROM "Incident" i
WHERE w."incidentId" = i."id"
  AND w."organizationId" IS NULL;

ALTER TABLE "Workflow"
ADD CONSTRAINT "Workflow_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Workflow_organizationId_idx" ON "Workflow"("organizationId");
