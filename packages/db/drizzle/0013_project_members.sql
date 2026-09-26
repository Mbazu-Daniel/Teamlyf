CREATE TABLE "project_member" (
  "id" uuid PRIMARY KEY NOT NULL,
  "project_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "role" text DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_member_project_id_idx" ON "project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_member_organization_id_idx" ON "project_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_member_member_id_idx" ON "project_member" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_member_project_member_uidx" ON "project_member" USING btree ("project_id","member_id");
