import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "./references";
import { task } from "./task";

export const TASK_RELATION_TYPES = ["BLOCKED_BY", "RELATED_TO", "DUPLICATE_OF"] as const;
export type TaskRelationType = (typeof TASK_RELATION_TYPES)[number];

export const taskRelation = pgTable(
  "task_relation",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    sourceTaskId: uuid("source_task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    targetTaskId: uuid("target_task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull().default("RELATED_TO"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_relation_org_id_idx").on(t.organizationId),
    index("task_relation_source_task_id_idx").on(t.sourceTaskId),
    index("task_relation_target_task_id_idx").on(t.targetTaskId),
    uniqueIndex("task_relation_source_target_type_uidx").on(
      t.sourceTaskId,
      t.targetTaskId,
      t.relationType,
    ),
  ],
);
