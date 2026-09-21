CREATE TABLE "hr_department" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "name" text NOT NULL, "description" text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_department_org_name_idx" ON "hr_department" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE TABLE "hr_department_member" ("department_id" uuid NOT NULL, "member_id" uuid NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, PRIMARY KEY ("department_id","member_id"));
--> statement-breakpoint
CREATE TABLE "hr_employee_profile" ("member_id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "employee_number" text, "job_title" text, "employment_type" text DEFAULT 'full_time' NOT NULL, "status" text DEFAULT 'active' NOT NULL, "start_date" timestamp, "phone" text, "address" text, "emergency_contact_name" text, "emergency_contact_phone" text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "hr_leave_policy" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "name" text NOT NULL, "days_per_year" integer NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "hr_leave_request" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "member_id" uuid NOT NULL, "policy_id" uuid NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "reason" text, "status" text DEFAULT 'pending' NOT NULL, "reviewed_by_id" uuid, "reviewed_at" timestamp, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "hr_attendance" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "member_id" uuid NOT NULL, "check_in_at" timestamp NOT NULL, "check_out_at" timestamp, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
ALTER TABLE "hr_department" ADD CONSTRAINT "hr_department_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_department_member" ADD CONSTRAINT "hr_department_member_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "hr_department"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_department_member" ADD CONSTRAINT "hr_department_member_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_employee_profile" ADD CONSTRAINT "hr_employee_profile_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_employee_profile" ADD CONSTRAINT "hr_employee_profile_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_leave_policy" ADD CONSTRAINT "hr_leave_policy_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_leave_request" ADD CONSTRAINT "hr_leave_request_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_leave_request" ADD CONSTRAINT "hr_leave_request_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_leave_request" ADD CONSTRAINT "hr_leave_request_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "hr_leave_policy"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "hr_leave_request" ADD CONSTRAINT "hr_leave_request_reviewer_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "member"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;
