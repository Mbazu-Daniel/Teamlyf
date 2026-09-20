import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { agent } from "./agent";
import { member } from "../organization/member";
import { agentRunStatus } from "./run-status";
import { organizationReference } from "../organization/membership-columns";

export const agentRun = pgTable(
  "agent_run",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    agentId: uuid("agent_id").notNull(),
    memberId: uuid("member_id").notNull(),
    queueJobId: text("queue_job_id"),
    status: agentRunStatus("status").notNull().default("queued"),
    input: jsonb("input"),
    output: jsonb("output"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    attemptCount: integer("attempt_count").notNull().default(0),
    queuedAt: timestamp("queued_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.agentId],
      foreignColumns: [agent.organizationId, agent.id],
      name: "agent_run_organization_agent_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.memberId],
      foreignColumns: [member.organizationId, member.id],
      name: "agent_run_organization_member_fk",
    }),
    uniqueIndex("agent_run_queue_job_id_idx").on(t.queueJobId),
    index("agent_run_organization_id_idx").on(t.organizationId),
    index("agent_run_agent_id_idx").on(t.agentId),
    index("agent_run_member_id_idx").on(t.memberId),
    index("agent_run_status_idx").on(t.status),
    index("agent_run_created_at_idx").on(t.createdAt),
    check("agent_run_attempt_count_non_negative_check", t.attemptCount.gte(0)),
  ],
);
