import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, memberReference } from "../project/references";

export const note = pgTable(
  "note",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    parentId: uuid("parent_id"),
    createdById: memberReference("created_by_id"),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    linkedTaskId: uuid("linked_task_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("note_organization_id_idx").on(t.organizationId), index("note_parent_id_idx").on(t.parentId)],
);

export const noteUpdate = pgTable(
  "note_update",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    noteId: uuid("note_id").notNull().references(() => note.id, { onDelete: "cascade" }),
    update: text("update").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("note_update_note_created_idx").on(t.noteId, t.createdAt)],
);
