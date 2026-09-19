import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "./references";
import { task } from "./task";

export const taskComment = pgTable(
  "task_comment",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => taskComment.id, { onDelete: "cascade" }),
    actorId: memberReference("actor_id"),
    body: text("body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_comment_task_id_idx").on(t.taskId),
    index("task_comment_parent_id_idx").on(t.parentId),
  ],
);
