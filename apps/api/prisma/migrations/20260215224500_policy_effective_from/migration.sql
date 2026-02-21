-- AlterTable
ALTER TABLE "Policy"
ADD COLUMN "effectiveFrom" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Policy_effectiveFrom_idx" ON "Policy"("effectiveFrom");
