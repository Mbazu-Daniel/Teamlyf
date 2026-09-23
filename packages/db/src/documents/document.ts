import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

export const document = pgTable("document", {
  id: text("id").primaryKey().$defaultFn(generateId),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references(() => member.id),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  mimeType: text("mime_type").notNull().default("text/plain"),
  content: text("content"),
  objectKey: text("object_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("document_organization_idx").on(table.organizationId),
  index("document_parent_idx").on(table.parentId),
]);