import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";
import { agent } from "./agent";

export const agentPermissionPolicy = pgTable(
  "agent_permission_policy",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    memberId: uuid("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
    tool: text("tool").notNull(),
    effect: text("effect").notNull().default("allow"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("agent_permission_policy_organization_id_idx").on(t.organizationId),
    index("agent_permission_policy_member_id_idx").on(t.memberId),
    index("agent_permission_policy_agent_id_idx").on(t.agentId),
    uniqueIndex("agent_permission_policy_member_agent_tool_idx").on(
      t.organizationId,
      t.memberId,
      t.agentId,
      t.tool,
    ),
  ],
);
