import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../project/references";

export const agent = pgTable(
  "agent",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    name: text("name").notNull(),
    capabilityType: text("capability_type").notNull(),
    toolGrants: text("tool_grants").notNull().default("[]"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("agent_organization_id_idx").on(t.organizationId)],
);

export const agentTask = pgTable(
  "agent_task",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    agentId: uuid("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),
    status: text("status").notNull().default("queued"),
    approvalStatus: text("approval_status").notNull().default("not_required"),
    input: text("input").notNull().default("{}"),
    output: text("output"),
    toolCalls: text("tool_calls").notNull().default("[]"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("agent_task_org_status_idx").on(t.organizationId, t.status), index("agent_task_agent_idx").on(t.agentId)],
);

export const agentCredential = pgTable(
  "agent_credential",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    agentId: uuid("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    cipherText: text("cipher_text").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("agent_credential_scope_idx").on(t.organizationId, t.agentId)],
);

export const agentAuditLog = pgTable(
  "agent_audit_log",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    agentId: uuid("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
    agentTaskId: uuid("agent_task_id").references(() => agentTask.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    input: text("input").notNull().default("{}"),
    output: text("output"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("agent_audit_scope_idx").on(t.organizationId, t.agentId, t.createdAt)],
);
