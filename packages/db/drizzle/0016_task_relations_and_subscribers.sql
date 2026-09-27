CREATE TABLE "task_relation" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "source_task_id" uuid NOT NULL,
  "target_task_id" uuid NOT NULL,
  "relation_type" text DEFAULT 'RELATED_TO' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "task_subscriber" (
  "id" uuid PRIMARY KEY NOT NULL,
  "task_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "task_relation" ADD CONSTRAINT "task_relation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relation" ADD CONSTRAINT "task_relation_source_task_id_task_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relation" ADD CONSTRAINT "task_relation_target_task_id_task_id_fk" FOREIGN KEY ("target_task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subscriber" ADD CONSTRAINT "task_subscriber_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subscriber" ADD CONSTRAINT "task_subscriber_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subscriber" ADD CONSTRAINT "task_subscriber_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_relation_org_id_idx" ON "task_relation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_relation_source_task_id_idx" ON "task_relation" USING btree ("source_task_id");--> statement-breakpoint
CREATE INDEX "task_relation_target_task_id_idx" ON "task_relation" USING btree ("target_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_relation_source_target_type_uidx" ON "task_relation" USING btree ("source_task_id","target_task_id","relation_type");--> statement-breakpoint
CREATE INDEX "task_subscriber_task_id_idx" ON "task_subscriber" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_subscriber_org_id_idx" ON "task_subscriber" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_subscriber_member_id_idx" ON "task_subscriber" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_subscriber_task_member_uidx" ON "task_subscriber" USING btree ("task_id","member_id");
