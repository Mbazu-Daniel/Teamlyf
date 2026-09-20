import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../organization/membership-columns";

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    userId: uuid("user_id"),
    agentId: uuid("agent_id"),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    source: text("source").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 14,
      scale: 8,
    }),
    allowanceConsumed: integer("allowance_consumed").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_usage_organization_id_idx").on(t.organizationId),
    index("ai_usage_user_id_idx").on(t.userId),
    index("ai_usage_agent_id_idx").on(t.agentId),
    index("ai_usage_created_at_idx").on(t.createdAt),
  ],
);
