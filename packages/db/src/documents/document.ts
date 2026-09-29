import { boolean, integer, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";

export const document = pgTable("document", {
  id: text("id").primaryKey().$defaultFn(generateId),
  organizationId: organizationReference(),
  ownerId: uuid("owner_id").references(() => member.id, { onDelete: "set null" }),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  mimeType: text("mime_type").notNull().default("text/plain"),
  content: text("content"),
  objectKey: text("object_key"),
  fileSize: integer("file_size").notNull().default(0),
  uploadReady: boolean("upload_ready").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("document_organization_idx").on(table.organizationId),
  index("document_parent_idx").on(table.parentId),
]);
