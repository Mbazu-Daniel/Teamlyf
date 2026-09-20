import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { aiProviderSource } from "./provider-source";
import { member } from "../organization/member";
import { agent } from "../agent/agent";
import { organizationReference } from "../organization/membership-columns";

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id),
    agentId: uuid("agent_id"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    source: aiProviderSource("source").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 14,
      scale: 8,
      mode: "number",
    }),
    allowanceConsumed: integer("allowance_consumed").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.memberId],
      foreignColumns: [member.organizationId, member.id],
      name: "ai_usage_organization_member_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.agentId],
      foreignColumns: [agent.organizationId, agent.id],
      name: "ai_usage_organization_agent_fk",
    }),
    check("ai_usage_tokens_total_check", t.totalTokens.eq(t.inputTokens.add(t.outputTokens))),
    check("ai_usage_tokens_non_negative_check", t.inputTokens.gte(0)),
    check("ai_usage_output_tokens_non_negative_check", t.outputTokens.gte(0)),
    check("ai_usage_total_tokens_non_negative_check", t.totalTokens.gte(0)),
    check("ai_usage_allowance_non_negative_check", t.allowanceConsumed.gte(0)),
    check("ai_usage_cost_non_negative_check", t.estimatedCostUsd.isNull().or(t.estimatedCostUsd.gte(0))),
    index("ai_usage_organization_id_idx").on(t.organizationId),
    index("ai_usage_member_id_idx").on(t.memberId),
    index("ai_usage_agent_id_idx").on(t.agentId),
    index("ai_usage_created_at_idx").on(t.createdAt),
  ],
);
