CREATE TABLE "sprint" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "name" text NOT NULL,
  "start_date" timestamp,
  "end_date" timestamp,
  "status" text DEFAULT 'planned' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprint_organization_id_idx" ON "sprint" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sprint_project_id_idx" ON "sprint" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sprint_status_idx" ON "sprint" USING btree ("status");
