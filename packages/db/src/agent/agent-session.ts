import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";
import { project } from "../project/project";
import { task } from "../project/task";
import { agent } from "./agent";
import { agentSessionStatus } from "./session-status";
import { agentRun } from "./agent-run";

export const agentSession = pgTable(
  "agent_session",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    runId: uuid("run_id").notNull().references(() => agentRun.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").notNull().references(() => agent.id),
    memberId: uuid("member_id").notNull().references(() => member.id),
    projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
    status: agentSessionStatus("status").notNull().default("active"),
    workspaceRoot: text("workspace_root"),
    workingBranch: text("working_branch"),
    metadata: jsonb("metadata"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
  },
  (t) => [
    index("agent_session_organization_id_idx").on(t.organizationId),
    index("agent_session_run_id_idx").on(t.runId),
    index("agent_session_project_id_idx").on(t.projectId),
    index("agent_session_task_id_idx").on(t.taskId),
  ],
);
