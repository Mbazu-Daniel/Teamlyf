CREATE TABLE "note" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "owner_id" uuid NOT NULL,
  "parent_id" uuid,
  "title" text NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "note_organization_id_idx" ON "note" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "note_parent_id_idx" ON "note" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX "note_owner_id_idx" ON "note" USING btree ("owner_id");
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_owner_id_member_id_fk" FOREIGN KEY ("owner_id") REFERENCES "member"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_parent_id_note_id_fk" FOREIGN KEY ("parent_id") REFERENCES "note"("id") ON DELETE RESTRICT;
