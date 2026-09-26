CREATE TABLE "task_attachment" ("id" uuid PRIMARY KEY NOT NULL,"task_id" uuid NOT NULL,"member_id" uuid NOT NULL,"name" text NOT NULL,"url" text NOT NULL,"mime_type" text,"size" text,"created_at" timestamp DEFAULT now() NOT NULL);--> statement-breakpoint
ALTER TABLE "task_attachment" ADD CONSTRAINT "task_attachment_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachment" ADD CONSTRAINT "task_attachment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_attachment_task_id_idx" ON "task_attachment" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_attachment_member_id_idx" ON "task_attachment" USING btree ("member_id");
