-- AlterTable
ALTER TABLE "ChangeRequest"
ADD COLUMN "pirStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN "pirSummary" TEXT,
ADD COLUMN "pirOutcome" TEXT,
ADD COLUMN "pirCompletedAt" TIMESTAMP(3),
ADD COLUMN "pirReviewedById" TEXT;

-- CreateTable
CREATE TABLE "PolicyException" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangeRequest_pirStatus_idx" ON "ChangeRequest"("pirStatus");
CREATE INDEX "PolicyException_policyId_idx" ON "PolicyException"("policyId");
CREATE INDEX "PolicyException_organizationId_idx" ON "PolicyException"("organizationId");
CREATE INDEX "PolicyException_status_idx" ON "PolicyException"("status");
CREATE INDEX "PolicyException_requestedById_idx" ON "PolicyException"("requestedById");

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_pirReviewedById_fkey" FOREIGN KEY ("pirReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyException" ADD CONSTRAINT "PolicyException_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyException" ADD CONSTRAINT "PolicyException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyException" ADD CONSTRAINT "PolicyException_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyException" ADD CONSTRAINT "PolicyException_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
