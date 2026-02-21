-- CreateTable
CREATE TABLE "KnowledgeArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "editedById" TEXT,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivilegedAccessRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedRoleIds" TEXT[],
    "currentRoleIds" TEXT[],
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewComment" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivilegedAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CABPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minimumApprovers" INTEGER NOT NULL DEFAULT 2,
    "quorumPercent" INTEGER NOT NULL DEFAULT 60,
    "emergencyChangeRequiresCab" BOOLEAN NOT NULL DEFAULT true,
    "meetingCadence" TEXT NOT NULL DEFAULT 'weekly',
    "maintenanceWindow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CABPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CABMember" (
    "id" TEXT NOT NULL,
    "cabPolicyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CABMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticleVersion_articleId_version_key" ON "KnowledgeArticleVersion"("articleId", "version");
CREATE INDEX "KnowledgeArticleVersion_articleId_idx" ON "KnowledgeArticleVersion"("articleId");
CREATE INDEX "KnowledgeArticleVersion_organizationId_idx" ON "KnowledgeArticleVersion"("organizationId");
CREATE INDEX "KnowledgeArticleVersion_createdAt_idx" ON "KnowledgeArticleVersion"("createdAt");

CREATE INDEX "PrivilegedAccessRequest_organizationId_idx" ON "PrivilegedAccessRequest"("organizationId");
CREATE INDEX "PrivilegedAccessRequest_status_idx" ON "PrivilegedAccessRequest"("status");
CREATE INDEX "PrivilegedAccessRequest_targetUserId_idx" ON "PrivilegedAccessRequest"("targetUserId");

CREATE UNIQUE INDEX "CABPolicy_organizationId_key" ON "CABPolicy"("organizationId");
CREATE UNIQUE INDEX "CABMember_cabPolicyId_userId_key" ON "CABMember"("cabPolicyId", "userId");
CREATE INDEX "CABMember_cabPolicyId_idx" ON "CABMember"("cabPolicyId");
CREATE INDEX "CABMember_userId_idx" ON "CABMember"("userId");

-- AddForeignKey
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrivilegedAccessRequest" ADD CONSTRAINT "PrivilegedAccessRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivilegedAccessRequest" ADD CONSTRAINT "PrivilegedAccessRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivilegedAccessRequest" ADD CONSTRAINT "PrivilegedAccessRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivilegedAccessRequest" ADD CONSTRAINT "PrivilegedAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CABPolicy" ADD CONSTRAINT "CABPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CABMember" ADD CONSTRAINT "CABMember_cabPolicyId_fkey" FOREIGN KEY ("cabPolicyId") REFERENCES "CABPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CABMember" ADD CONSTRAINT "CABMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
