CREATE TABLE "subscription" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "provider" text DEFAULT 'bachs' NOT NULL,
  "provider_customer_id" text NOT NULL,
  "provider_subscription_id" text,
  "plan" text DEFAULT 'starter' NOT NULL,
  "status" text DEFAULT 'inactive' NOT NULL,
  "seat_limit" text DEFAULT '5' NOT NULL,
  "agent_limit" text DEFAULT '0' NOT NULL,
  "current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_organization_unique_idx" ON "subscription" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "subscription_provider_customer_idx" ON "subscription" USING btree ("provider","provider_customer_id");
--> statement-breakpoint
CREATE INDEX "subscription_provider_subscription_idx" ON "subscription" USING btree ("provider_subscription_id");
