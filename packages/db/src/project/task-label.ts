import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { task } from "./task";
import { label } from "./label";

export const taskLabel = pgTable(
  "task_label",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_label_task_id_idx").on(t.taskId),
    index("task_label_label_id_idx").on(t.labelId),
  ],
);
