ALTER TABLE "note" ADD COLUMN "task_id" uuid;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_task_id_idx" ON "note" ("task_id");--> statement-breakpoint
ALTER TABLE "channel_member" ADD COLUMN "last_read_at" timestamp with time zone;
