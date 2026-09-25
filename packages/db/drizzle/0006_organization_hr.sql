CREATE TABLE "department" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "name" text NOT NULL, "description" text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX "department_org_name_idx" ON "department" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE TABLE "department_member" ("department_id" uuid NOT NULL, "member_id" uuid NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, PRIMARY KEY ("department_id","member_id"));
--> statement-breakpoint
CREATE TABLE "member_profile" ("member_id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "employee_number" text, "job_title" text, "employment_type" text DEFAULT 'full_time' NOT NULL, "status" text DEFAULT 'active' NOT NULL, "start_date" timestamp, "phone" text, "address" text, "emergency_contact_name" text, "emergency_contact_phone" text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "leave_policy" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "name" text NOT NULL, "days_per_year" integer NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "leave_request" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "member_id" uuid NOT NULL, "policy_id" uuid NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "reason" text, "status" text DEFAULT 'pending' NOT NULL, "reviewed_by_id" uuid, "reviewed_at" timestamp, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "department_member" ADD CONSTRAINT "department_member_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "department_member" ADD CONSTRAINT "department_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "member_profile" ADD CONSTRAINT "member_profile_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "member_profile" ADD CONSTRAINT "member_profile_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "leave_policy" ADD CONSTRAINT "leave_policy_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "leave_policy"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_reviewer_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "member"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "member_profile_org_idx" ON "member_profile" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "department_org_idx" ON "department" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "department_member_member_idx" ON "department_member" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "leave_policy_org_idx" ON "leave_policy" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "leave_request_org_idx" ON "leave_request" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "leave_request_member_idx" ON "leave_request" USING btree ("member_id");
