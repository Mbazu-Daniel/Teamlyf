import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../organization/membership-columns";

export const subscription = pgTable(
  "subscription",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    provider: text("provider").notNull().default("bachs"),
    providerCustomerId: text("provider_customer_id").notNull(),
    providerSubscriptionId: text("provider_subscription_id"),
    plan: text("plan").notNull().default("starter"),
    status: text("status").notNull().default("inactive"),
    seatLimit: text("seat_limit").notNull().default("5"),
    agentLimit: text("agent_limit").notNull().default("0"),
    currentPeriodEnd: timestamp("current_period_end"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subscription_organization_unique_idx").on(t.organizationId),
    index("subscription_provider_customer_idx").on(t.provider, t.providerCustomerId),
    index("subscription_provider_subscription_idx").on(t.providerSubscriptionId),
  ],
);
