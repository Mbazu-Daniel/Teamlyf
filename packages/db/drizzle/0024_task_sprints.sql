ALTER TABLE "task" ADD COLUMN "sprint_id" uuid REFERENCES "sprint"("id") ON DELETE SET NULL;
CREATE INDEX "task_sprint_id_idx" ON "task"("sprint_id");
