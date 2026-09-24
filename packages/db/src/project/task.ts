import { foreignKey, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "./references";
import { project } from "./project";
import { status } from "./status";

export const task = pgTable(
  "task",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    statusId: uuid("status_id")
      .notNull()
      .references(() => status.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => task.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priority: text("priority").notNull().default("none"),
    sequenceId: integer("sequence_id").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(65535),
    startDate: timestamp("start_date", { mode: "date" }),
    targetDate: timestamp("target_date", { mode: "date" }),
    completedAt: timestamp("completed_at"),
    createdById: memberReference("created_by_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_project_id_idx").on(t.projectId),
    index("task_status_id_idx").on(t.statusId),
    index("task_parent_id_idx").on(t.parentId),
    index("task_created_by_id_idx").on(t.createdById),
    foreignKey({
      columns: [t.projectId, t.statusId],
      foreignColumns: [status.projectId, status.id],
      name: "task_project_status_fk",
    }),
  ],
);
