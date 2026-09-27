CREATE TABLE "task_attachment" (
  "id" uuid PRIMARY KEY NOT NULL,
  "task_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "file_key" text NOT NULL,
  "original_file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "file_size" bigint NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "task_attachment" ADD CONSTRAINT "task_attachment_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachment" ADD CONSTRAINT "task_attachment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachment" ADD CONSTRAINT "task_attachment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_attachment_task_id_idx" ON "task_attachment" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_attachment_organization_id_idx" ON "task_attachment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_attachment_member_id_idx" ON "task_attachment" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_attachment_file_key_uidx" ON "task_attachment" USING btree ("file_key");
