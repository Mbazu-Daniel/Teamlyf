CREATE TYPE "public"."agent_session_status" AS ENUM('active', 'completed', 'failed', 'interrupted');
--> statement-breakpoint
CREATE TABLE "agent_session" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "run_id" uuid NOT NULL,
  "agent_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "status" "agent_session_status" DEFAULT 'active' NOT NULL,
  "workspace_root" text,
  "working_branch" text,
  "metadata" jsonb,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_event" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "sequence" integer NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "agent_run"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agent"("id");
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id");
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_event" ADD CONSTRAINT "agent_event_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_event" ADD CONSTRAINT "agent_event_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "agent_session_organization_id_idx" ON "agent_session" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "agent_session_run_id_idx" ON "agent_session" USING btree ("run_id");
--> statement-breakpoint
CREATE INDEX "agent_session_project_id_idx" ON "agent_session" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "agent_session_task_id_idx" ON "agent_session" USING btree ("task_id");
--> statement-breakpoint
CREATE INDEX "agent_event_organization_id_idx" ON "agent_event" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "agent_event_session_id_idx" ON "agent_event" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX "agent_event_session_sequence_idx" ON "agent_event" USING btree ("session_id", "sequence");
