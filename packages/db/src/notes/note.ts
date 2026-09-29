import { boolean, integer, index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "../organization/member-reference";
import { organizationReference } from "../organization/membership-columns";
import { task } from "../project/task";

export const note = pgTable(
  "note",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    ownerId: memberReference("owner_id"),
    parentId: uuid("parent_id"),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    private: boolean("private").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    revision: integer("revision").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("note_organization_id_idx").on(t.organizationId),
    index("note_parent_id_idx").on(t.parentId),
    index("note_task_id_idx").on(t.taskId),
    index("note_owner_id_idx").on(t.ownerId),
  ],
);

export const noteSnapshot = pgTable("note_snapshot", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  noteId: uuid("note_id").notNull().references(() => note.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("note_snapshot_note_idx").on(t.noteId)]);

export const noteFavorite = pgTable("note_favorite", {
  noteId: uuid("note_id").notNull().references(() => note.id, { onDelete: "cascade" }),
  memberId: memberReference(),
}, (t) => [primaryKey({ columns: [t.noteId, t.memberId] })]);

export const notePresence = pgTable("note_presence", {
  noteId: uuid("note_id").notNull().references(() => note.id, { onDelete: "cascade" }),
  memberId: memberReference(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.noteId, t.memberId] })]);
