CREATE TABLE "channel" ("id" uuid PRIMARY KEY NOT NULL, "organization_id" uuid NOT NULL, "name" text NOT NULL, "kind" text DEFAULT 'channel' NOT NULL, "is_private" boolean DEFAULT false NOT NULL, "created_by_id" uuid, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "channel_member" ("channel_id" uuid NOT NULL, "member_id" uuid NOT NULL, "joined_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "channel_member_channel_id_member_id_pk" PRIMARY KEY("channel_id","member_id"));
--> statement-breakpoint
CREATE TABLE "message" ("id" uuid PRIMARY KEY NOT NULL, "channel_id" uuid NOT NULL, "sender_kind" text DEFAULT 'member' NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "thread_root_id" uuid, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "message_reaction" ("message_id" uuid NOT NULL, "member_id" uuid NOT NULL, "emoji" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "message_reaction_message_id_member_id_emoji_pk" PRIMARY KEY("message_id","member_id","emoji"));
--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_created_by_id_member_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "channel_member" ADD CONSTRAINT "channel_member_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "channel_member" ADD CONSTRAINT "channel_member_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "channel_organization_idx" ON "channel" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "channel_organization_name_idx" ON "channel" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE INDEX "channel_member_member_idx" ON "channel_member" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "message_channel_created_idx" ON "message" USING btree ("channel_id","created_at");
--> statement-breakpoint
CREATE INDEX "message_thread_idx" ON "message" USING btree ("thread_root_id");
--> statement-breakpoint
CREATE INDEX "message_reaction_message_idx" ON "message_reaction" USING btree ("message_id");