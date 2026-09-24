CREATE TYPE "public"."agent_run_status" AS ENUM('queued', 'running', 'completed', 'failed', 'cancelled');
--> statement-breakpoint
CREATE TYPE "public"."ai_provider_source" AS ENUM('managed', 'byok');
--> statement-breakpoint
CREATE TABLE "agent" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_run" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "agent_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "queue_job_id" text,
  "status" "agent_run_status" DEFAULT 'queued' NOT NULL,
  "input" jsonb,
  "output" jsonb,
  "error_code" text,
  "error_message" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "queued_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_config" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "source" "ai_provider_source" NOT NULL,
  "encrypted_api_key" text,
  "key_version" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_provider_config_provider_non_empty_check" CHECK (length(trim("provider")) > 0),
  CONSTRAINT "ai_provider_config_model_non_empty_check" CHECK (length(trim("model")) > 0),
  CONSTRAINT "ai_provider_config_byok_key_check" CHECK (("source" = 'byok' AND "encrypted_api_key" IS NOT NULL) OR ("source" = 'managed' AND "encrypted_api_key" IS NULL)),
  CONSTRAINT "ai_provider_config_key_version_check" CHECK (("encrypted_api_key" IS NULL AND "key_version" IS NULL) OR ("encrypted_api_key" IS NOT NULL AND "key_version" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "agent_id" uuid,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "source" "ai_provider_source" NOT NULL,
  "input_tokens" integer DEFAULT 0 NOT NULL,
  "output_tokens" integer DEFAULT 0 NOT NULL,
  "total_tokens" integer DEFAULT 0 NOT NULL,
  "estimated_cost_usd" numeric(14, 8),
  "allowance_consumed" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_usage_tokens_total_check" CHECK ("total_tokens" = "input_tokens" + "output_tokens"),
  CONSTRAINT "ai_usage_tokens_non_negative_check" CHECK ("input_tokens" >= 0),
  CONSTRAINT "ai_usage_output_tokens_non_negative_check" CHECK ("output_tokens" >= 0),
  CONSTRAINT "ai_usage_total_tokens_non_negative_check" CHECK ("total_tokens" >= 0),
  CONSTRAINT "ai_usage_allowance_non_negative_check" CHECK ("allowance_consumed" >= 0),
  CONSTRAINT "ai_usage_cost_non_negative_check" CHECK ("estimated_cost_usd" IS NULL OR "estimated_cost_usd" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_id_id_idx" ON "member" USING btree ("organization_id","id");
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_organization_id_id_idx" ON "agent" USING btree ("organization_id","id");
--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_organization_agent_fk" FOREIGN KEY ("organization_id","agent_id") REFERENCES "agent"("organization_id","id");
--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_organization_member_fk" FOREIGN KEY ("organization_id","member_id") REFERENCES "member"("organization_id","id");
--> statement-breakpoint
ALTER TABLE "ai_provider_config" ADD CONSTRAINT "ai_provider_config_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_organization_member_fk" FOREIGN KEY ("organization_id","member_id") REFERENCES "member"("organization_id","id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_organization_agent_fk" FOREIGN KEY ("organization_id","agent_id") REFERENCES "agent"("organization_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_organization_name_idx" ON "agent" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE INDEX "agent_organization_id_idx" ON "agent" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_run_queue_job_id_idx" ON "agent_run" USING btree ("queue_job_id");
--> statement-breakpoint
CREATE INDEX "agent_run_organization_id_idx" ON "agent_run" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "agent_run_agent_id_idx" ON "agent_run" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX "agent_run_member_id_idx" ON "agent_run" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "agent_run_status_idx" ON "agent_run" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "agent_run_created_at_idx" ON "agent_run" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ai_provider_config_organization_id_idx" ON "ai_provider_config" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_provider_config_org_source_provider_model_idx" ON "ai_provider_config" USING btree ("organization_id","source","provider","model");
--> statement-breakpoint
CREATE INDEX "ai_usage_organization_id_idx" ON "ai_usage" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "ai_usage_member_id_idx" ON "ai_usage" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "ai_usage_agent_id_idx" ON "ai_usage" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_attempt_count_non_negative_check" CHECK ("attempt_count" >= 0);
