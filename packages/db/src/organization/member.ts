import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, userReference } from "./membership-columns";

export const member = pgTable(
  "member",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    userId: userReference("user_id"),
    organizationId: organizationReference(),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("member_user_id_idx").on(t.userId),
    index("member_organization_id_idx").on(t.organizationId),
    uniqueIndex("member_organization_id_id_idx").on(t.organizationId, t.id),
  ],
);

