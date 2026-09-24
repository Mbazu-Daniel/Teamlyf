UPDATE "task" AS t
SET "status_id" = replacement."id"
FROM LATERAL (
  SELECT s."id"
  FROM "status" AS s
  WHERE s."project_id" = t."project_id"
  ORDER BY s."default" DESC, s."sequence" ASC, s."created_at" ASC, s."id" ASC
  LIMIT 1
) AS replacement
JOIN "status" AS current_status ON current_status."id" = t."status_id"
WHERE current_status."project_id" <> t."project_id";--> statement-breakpoint
CREATE UNIQUE INDEX "status_project_id_id_uidx" ON "status" USING btree ("project_id","id");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_project_status_fk" FOREIGN KEY ("project_id","status_id") REFERENCES "public"."status"("project_id","id") ON DELETE cascade ON UPDATE no action;
