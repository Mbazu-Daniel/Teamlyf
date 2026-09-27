-- Chat messaging + calls: direct messages, attachments, mentions, call records.

ALTER TABLE "channel" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "channel_member" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_member" ADD COLUMN IF NOT EXISTS "is_muted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_member" ADD COLUMN IF NOT EXISTS "muted_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "message_type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "system_event_data" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "link_previews" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD COLUMN IF NOT EXISTS "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD COLUMN IF NOT EXISTS "message_type" text DEFAULT 'channel' NOT NULL;--> statement-breakpoint
UPDATE "message_reaction" SET "organization_id" = "channel"."organization_id" FROM "message", "channel" WHERE "message_reaction"."message_id" = "message"."id" AND "message"."channel_id" = "channel"."id" AND "message_reaction"."organization_id" IS NULL;--> statement-breakpoint
DELETE FROM "message_reaction" WHERE "organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "message_reaction" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reaction" DROP CONSTRAINT IF EXISTS "message_reaction_message_id_message_id_fk";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_reaction_organization_idx" ON "message_reaction" ("organization_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "direct_message" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "recipient_id" uuid NOT NULL,
  "content" text NOT NULL,
  "read_at" timestamp with time zone,
  "parent_message_id" uuid,
  "edited_at" timestamp with time zone,
  "message_type" text DEFAULT 'text' NOT NULL,
  "system_event_data" jsonb,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "link_previews" jsonb,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_sender_id_member_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_recipient_id_member_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "direct_message_org_sender_idx" ON "direct_message" ("organization_id","sender_id");--> statement-breakpoint
CREATE INDEX "direct_message_org_recipient_idx" ON "direct_message" ("organization_id","recipient_id");--> statement-breakpoint
CREATE INDEX "direct_message_pair_idx" ON "direct_message" ("organization_id","sender_id","recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "direct_message_parent_idx" ON "direct_message" ("parent_message_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "message_attachment" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "direct_message_id" uuid,
  "channel_message_id" uuid,
  "member_id" uuid,
  "file_key" text NOT NULL,
  "original_file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "file_size" bigint NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_attachment_direct_idx" ON "message_attachment" ("direct_message_id");--> statement-breakpoint
CREATE INDEX "message_attachment_channel_idx" ON "message_attachment" ("channel_message_id");--> statement-breakpoint
CREATE INDEX "message_attachment_organization_idx" ON "message_attachment" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_attachment_file_key_uidx" ON "message_attachment" ("file_key");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "message_mention" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "message_id" uuid NOT NULL,
  "message_type" text DEFAULT 'channel' NOT NULL,
  "mentioned_member_id" uuid NOT NULL,
  "mentioned_by_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "message_mention" ADD CONSTRAINT "message_mention_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_mention" ADD CONSTRAINT "message_mention_mentioned_member_id_member_id_fk" FOREIGN KEY ("mentioned_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_mention" ADD CONSTRAINT "message_mention_mentioned_by_id_member_id_fk" FOREIGN KEY ("mentioned_by_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_mention_member_idx" ON "message_mention" ("organization_id","mentioned_member_id");--> statement-breakpoint
CREATE INDEX "message_mention_message_idx" ON "message_mention" ("message_id","message_type");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "call_room" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "created_by_id" uuid,
  "channel_id" uuid,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "call_room" ADD CONSTRAINT "call_room_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_room" ADD CONSTRAINT "call_room_created_by_id_member_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_room" ADD CONSTRAINT "call_room_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "call_room_slug_uidx" ON "call_room" ("slug");--> statement-breakpoint
CREATE INDEX "call_room_organization_idx" ON "call_room" ("organization_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "call_session" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "room_id" uuid,
  "room_name" text NOT NULL,
  "call_type" text DEFAULT 'direct' NOT NULL,
  "status" text DEFAULT 'initiated' NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_recording" boolean DEFAULT false NOT NULL,
  "recording_id" text,
  "recording_url" text,
  "locked_at" timestamp with time zone,
  "initiator_id" uuid NOT NULL,
  "channel_id" uuid,
  "recipient_id" uuid,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "duration" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_room_id_call_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."call_room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_initiator_id_member_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_session" ADD CONSTRAINT "call_session_recipient_id_member_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "call_session_room_name_uidx" ON "call_session" ("room_name");--> statement-breakpoint
CREATE INDEX "call_session_organization_idx" ON "call_session" ("organization_id");--> statement-breakpoint
CREATE INDEX "call_session_initiator_idx" ON "call_session" ("initiator_id");--> statement-breakpoint
CREATE INDEX "call_session_channel_idx" ON "call_session" ("channel_id");--> statement-breakpoint
CREATE INDEX "call_session_recipient_idx" ON "call_session" ("recipient_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "call_participant" (
  "id" uuid PRIMARY KEY NOT NULL,
  "call_session_id" uuid NOT NULL,
  "member_id" uuid,
  "is_guest" boolean DEFAULT false NOT NULL,
  "guest_name" text,
  "status" text DEFAULT 'joined' NOT NULL,
  "joined_at" timestamp with time zone,
  "left_at" timestamp with time zone,
  "was_present" timestamp with time zone,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "call_participant" ADD CONSTRAINT "call_participant_call_session_id_call_session_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."call_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_participant" ADD CONSTRAINT "call_participant_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "call_participant_session_idx" ON "call_participant" ("call_session_id");--> statement-breakpoint
CREATE INDEX "call_participant_member_idx" ON "call_participant" ("member_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "video_minute_period" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "included_allowance" bigint DEFAULT 0 NOT NULL,
  "purchased_bonus" bigint DEFAULT 0 NOT NULL,
  "used" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "video_minute_period" ADD CONSTRAINT "video_minute_period_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "video_minute_usage_event" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "period_id" uuid,
  "call_session_id" uuid,
  "participant_minutes" integer DEFAULT 0 NOT NULL,
  "participant_count" integer DEFAULT 0 NOT NULL,
  "duration_seconds" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "video_minute_usage_event" ADD CONSTRAINT "video_minute_usage_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
