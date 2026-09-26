CREATE TABLE "agent_checkpoint" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "sequence" integer NOT NULL,
  "reason" text NOT NULL,
  "state" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_checkpoint" ADD CONSTRAINT "agent_checkpoint_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "agent_checkpoint" ADD CONSTRAINT "agent_checkpoint_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "agent_session"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "agent_checkpoint_organization_id_idx" ON "agent_checkpoint" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "agent_checkpoint_session_sequence_idx" ON "agent_checkpoint" USING btree ("session_id", "sequence");
