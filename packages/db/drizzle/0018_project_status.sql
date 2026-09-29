ALTER TABLE "project" ADD COLUMN "status" text DEFAULT 'planned' NOT NULL;
ALTER TABLE "project" ADD CONSTRAINT "project_status_valid" CHECK ("status" IN ('planned', 'backlog', 'in_progress', 'paused', 'completed', 'cancelled'));
