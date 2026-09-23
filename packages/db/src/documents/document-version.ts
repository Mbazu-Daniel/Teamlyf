import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { document } from "./document";
import { generateId } from "../id";
import { member } from "../organization/member";

export const documentVersion = pgTable("document_version", {
  id: text("id").primaryKey().$defaultFn(generateId),
  documentId: text("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  createdById: uuid("created_by_id").references(() => member.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("document_version_document_idx").on(table.documentId),
  uniqueIndex("document_version_document_version_unique").on(table.documentId, table.version),
]);