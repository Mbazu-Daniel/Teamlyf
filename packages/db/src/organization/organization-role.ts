import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "./membership-columns";

/** Dynamic per-org roles (better-auth organization plugin when dynamicAccessControl is on). */
export const organizationRole = pgTable(
  "organization_role",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    role: text("role").notNull(),
    permission: text("permission").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("organization_role_organization_id_idx").on(t.organizationId),
    index("organization_role_role_idx").on(t.role),
  ],
);
