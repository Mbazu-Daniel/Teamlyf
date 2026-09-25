import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
