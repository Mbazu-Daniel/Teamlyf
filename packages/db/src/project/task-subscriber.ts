import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "./references";
import { task } from "./task";

export const taskSubscriber = pgTable(
  "task_subscriber",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    organizationId: organizationReference(),
    memberId: memberReference(),
    preferences: jsonb("preferences").$type<Record<string, boolean>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_subscriber_task_id_idx").on(t.taskId),
    index("task_subscriber_org_id_idx").on(t.organizationId),
    index("task_subscriber_member_id_idx").on(t.memberId),
    uniqueIndex("task_subscriber_task_member_uidx").on(t.taskId, t.memberId),
  ],
);
