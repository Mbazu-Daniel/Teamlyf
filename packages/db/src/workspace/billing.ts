import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../project/references";

export const subscription = pgTable(
  "subscription",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    bachsCustomerId: text("bachs_customer_id").notNull(),
    bachsSubscriptionId: text("bachs_subscription_id"),
    plan: text("plan").notNull().default("starter"),
    status: text("status").notNull().default("inactive"),
    seatLimit: text("seat_limit").notNull().default("5"),
    agentLimit: text("agent_limit").notNull().default("0"),
    currentPeriodEnd: timestamp("current_period_end"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscription_organization_unique_idx").on(t.organizationId), index("subscription_bachs_customer_idx").on(t.bachsCustomerId)],
);
