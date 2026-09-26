CREATE TABLE "direct_message" ("id" uuid PRIMARY KEY NOT NULL,"organization_id" uuid NOT NULL,"sender_id" uuid NOT NULL,"recipient_id" uuid NOT NULL,"content" text NOT NULL,"parent_message_id" uuid,"read_at" timestamp,"edited_at" timestamp,"created_at" timestamp DEFAULT now() NOT NULL,"deleted_at" timestamp);--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_sender_id_member_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_recipient_id_member_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "direct_message_organization_id_idx" ON "direct_message" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "direct_message_sender_id_idx" ON "direct_message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "direct_message_recipient_id_idx" ON "direct_message" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "direct_message_parent_message_id_idx" ON "direct_message" USING btree ("parent_message_id");
