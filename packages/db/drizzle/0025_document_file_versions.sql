ALTER TABLE "document_version" ADD COLUMN "object_key" text;
--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "mime_type" text NOT NULL DEFAULT 'text/plain';
--> statement-breakpoint
ALTER TABLE "document_version" ADD COLUMN "file_size" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE "document_version" AS v SET "object_key" = d."object_key", "mime_type" = d."mime_type", "file_size" = d."file_size" FROM "document" AS d WHERE d."id" = v."document_id";
