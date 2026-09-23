CREATE TABLE "document" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "owner_id" uuid,
  "parent_id" text,
  "title" text NOT NULL,
  "mime_type" text DEFAULT 'text/plain' NOT NULL,
  "content" text,
  "object_key" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_permission" (
  "document_id" text NOT NULL,
  "subject_kind" text NOT NULL,
  "subject_id" text NOT NULL,
  "access" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "document_permission_document_id_subject_kind_subject_id_pk" PRIMARY KEY("document_id","subject_kind","subject_id")
);
--> statement-breakpoint
CREATE TABLE "document_version" (
  "id" text PRIMARY KEY NOT NULL,
  "document_id" text NOT NULL,
  "version" text NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "created_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_owner_id_member_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document_permission" ADD CONSTRAINT "document_permission_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_created_by_id_member_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "document_organization_idx" ON "document" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "document_parent_idx" ON "document" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX "document_permission_subject_idx" ON "document_permission" USING btree ("subject_kind","subject_id");
--> statement-breakpoint
CREATE INDEX "document_version_document_idx" ON "document_version" USING btree ("document_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "document_version_document_version_unique" ON "document_version" USING btree ("document_id","version");