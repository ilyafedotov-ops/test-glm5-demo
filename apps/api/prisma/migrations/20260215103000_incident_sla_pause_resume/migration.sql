-- SLA pause/resume tracking for ITIL pending/on-hold behavior
ALTER TABLE "Incident"
ADD COLUMN "slaPausedAt" TIMESTAMP(3),
ADD COLUMN "slaTotalPausedMins" INTEGER NOT NULL DEFAULT 0;
