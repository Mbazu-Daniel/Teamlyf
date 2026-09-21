import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, memberReference } from "../project/references";

export const document = pgTable(
  "document",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    parentId: uuid("parent_id"),
    ownerId: memberReference("owner_id"),
    title: text("title").notNull(),
    mimeType: text("mime_type").notNull().default("text/plain"),
    objectKey: text("object_key"),
    content: text("content"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("document_organization_id_idx").on(t.organizationId), index("document_parent_id_idx").on(t.parentId)],
);

export const documentPermission = pgTable(
  "document_permission",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    documentId: uuid("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
    subjectKind: text("subject_kind").notNull(),
    subjectId: uuid("subject_id").notNull(),
    access: text("access").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("document_permission_lookup_idx").on(t.documentId, t.subjectKind, t.subjectId)],
);

export const documentVersion = pgTable(
  "document_version",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    documentId: uuid("document_id").notNull().references(() => document.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    createdById: memberReference("created_by_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("document_version_document_created_idx").on(t.documentId, t.createdAt)],
);
