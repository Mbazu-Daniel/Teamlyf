import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "../organization/references";

export const note = pgTable(
  "note",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    ownerId: memberReference(),
    parentId: uuid("parent_id"),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("note_organization_id_idx").on(t.organizationId),
    index("note_parent_id_idx").on(t.parentId),
    index("note_owner_id_idx").on(t.ownerId),
  ],
);
