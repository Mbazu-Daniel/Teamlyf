import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../organization/membership-columns";

export const agent = pgTable(
  "agent",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("agent_organization_id_idx").on(t.organizationId)],
);
