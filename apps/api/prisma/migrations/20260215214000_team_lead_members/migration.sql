-- AlterTable
ALTER TABLE "Team"
ADD COLUMN "leadId" TEXT;

-- CreateIndex
CREATE INDEX "Team_leadId_idx" ON "Team"("leadId");

-- AddForeignKey
ALTER TABLE "Team"
ADD CONSTRAINT "Team_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
