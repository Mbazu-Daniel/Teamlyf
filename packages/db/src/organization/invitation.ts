import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, userReference } from "./membership-columns";

export const invitation = pgTable(
  "invitation",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    email: text("email").notNull(),
    inviterId: userReference("inviter_id"),
    organizationId: organizationReference(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [
    index("invitation_email_idx").on(t.email),
    index("invitation_organization_id_idx").on(t.organizationId),
  ],
);

