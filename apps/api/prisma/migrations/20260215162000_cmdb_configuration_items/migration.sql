-- CreateTable
CREATE TABLE "ConfigurationItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'application',
    "status" TEXT NOT NULL DEFAULT 'active',
    "criticality" TEXT NOT NULL DEFAULT 'medium',
    "environment" TEXT,
    "ownerTeam" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigurationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentConfigurationItem" (
    "incidentId" TEXT NOT NULL,
    "configurationItemId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentConfigurationItem_pkey" PRIMARY KEY ("incidentId","configurationItemId")
);

-- Remove legacy free-form configuration item array from incidents
ALTER TABLE "Incident" DROP COLUMN IF EXISTS "configurationItemIds";

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationItem_organizationId_name_key" ON "ConfigurationItem"("organizationId", "name");
CREATE INDEX "ConfigurationItem_organizationId_idx" ON "ConfigurationItem"("organizationId");
CREATE INDEX "ConfigurationItem_type_idx" ON "ConfigurationItem"("type");
CREATE INDEX "ConfigurationItem_status_idx" ON "ConfigurationItem"("status");
CREATE INDEX "ConfigurationItem_criticality_idx" ON "ConfigurationItem"("criticality");
CREATE INDEX "IncidentConfigurationItem_configurationItemId_idx" ON "IncidentConfigurationItem"("configurationItemId");

-- AddForeignKey
ALTER TABLE "ConfigurationItem" ADD CONSTRAINT "ConfigurationItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentConfigurationItem" ADD CONSTRAINT "IncidentConfigurationItem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentConfigurationItem" ADD CONSTRAINT "IncidentConfigurationItem_configurationItemId_fkey" FOREIGN KEY ("configurationItemId") REFERENCES "ConfigurationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
