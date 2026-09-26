ALTER TABLE "agent_session" ALTER COLUMN "project_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent_session" ALTER COLUMN "task_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent_session" ADD COLUMN "context_type" text DEFAULT 'custom' NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent_session" ADD COLUMN "context_id" uuid;
--> statement-breakpoint
CREATE INDEX "agent_session_context_idx" ON "agent_session" USING btree ("context_type","context_id");
