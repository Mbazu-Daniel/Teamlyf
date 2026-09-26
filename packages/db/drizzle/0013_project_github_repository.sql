CREATE TABLE "project_repository" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "repository_id" text NOT NULL,
  "repository_full_name" text NOT NULL,
  "default_branch" text NOT NULL,
  "base_branch" text NOT NULL,
  "installation_id" text,
  "connected_by_member_id" uuid,
  "connected_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_repository" ADD CONSTRAINT "project_repository_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "project_repository" ADD CONSTRAINT "project_repository_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "project_repository" ADD CONSTRAINT "project_repository_connected_by_member_id_fk" FOREIGN KEY ("connected_by_member_id") REFERENCES "member"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "project_repository_project_idx" ON "project_repository" USING btree ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "project_repository_org_repo_idx" ON "project_repository" USING btree ("organization_id","repository_id");
--> statement-breakpoint
CREATE INDEX "project_repository_organization_id_idx" ON "project_repository" USING btree ("organization_id");
