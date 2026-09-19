import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "./references";
import { task } from "./task";

export const taskActivity = pgTable(
  "task_activity",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    actorId: memberReference("actor_id"),
    verb: text("verb").notNull().default("created"),
    field: text("field"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("task_activity_task_id_idx").on(t.taskId)],
);
