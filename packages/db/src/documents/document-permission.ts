import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { document } from "./document";

export const documentPermission = pgTable("document_permission", {
  documentId: text("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
  subjectKind: text("subject_kind").notNull(),
  subjectId: text("subject_id").notNull(),
  access: text("access").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.subjectKind, table.subjectId] }),
  index("document_permission_subject_idx").on(table.subjectKind, table.subjectId),
]);