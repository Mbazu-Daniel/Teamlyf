import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { task } from "./task";

/** `member` now; `agent` later (BYOK agents table — agentId has no FK until E9). */
export const taskAssignee = pgTable(
  "task_assignee",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("member"),
    memberId: uuid("member_id").references(() => member.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_assignee_task_id_idx").on(t.taskId),
    index("task_assignee_member_id_idx").on(t.memberId),
    index("task_assignee_agent_id_idx").on(t.agentId),
    uniqueIndex("task_assignee_task_member_uidx").on(t.taskId, t.memberId),
    uniqueIndex("task_assignee_task_agent_uidx").on(t.taskId, t.agentId),
  ],
);
