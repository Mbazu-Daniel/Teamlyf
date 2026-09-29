import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../organization/membership-columns";
import { member } from "../organization/member";

export const calendarEvent = pgTable("calendar_event", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  creatorId: uuid("creator_id").references(() => member.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  color: text("color").notNull().default("violet"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("calendar_event_org_start_idx").on(table.organizationId, table.startsAt)]);
