import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { milestone } from "./milestone";
import { task } from "./task";

export const milestoneTask = pgTable(
  "milestone_task",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    milestoneId: uuid("milestone_id")
      .notNull()
      .references(() => milestone.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("milestone_task_milestone_id_idx").on(t.milestoneId),
    index("milestone_task_task_id_idx").on(t.taskId),
  ],
);
