CREATE TABLE "agent_permission_policy" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "agent_id" uuid NOT NULL,
  "tool" text NOT NULL,
  "effect" text DEFAULT 'allow' NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "agent_permission_policy_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "agent_permission_policy_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "agent_permission_policy_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "agent_permission_policy_organization_id_idx" ON "agent_permission_policy" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "agent_permission_policy_member_id_idx" ON "agent_permission_policy" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "agent_permission_policy_agent_id_idx" ON "agent_permission_policy" USING btree ("agent_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_permission_policy_member_agent_tool_idx" ON "agent_permission_policy" USING btree ("organization_id","member_id","agent_id","tool");
