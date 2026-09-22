import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

export const channel = pgTable("channel", {
  id: text("id").primaryKey().$defaultFn(generateId),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("channel"),
  isPrivate: boolean("is_private").notNull().default(false),
  createdById: text("created_by_id").notNull().references(() => member.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index("channel_organization_idx").on(table.organizationId),
  organizationNameIdx: uniqueIndex("channel_organization_name_idx").on(table.organizationId, table.name),
}));