import { bigint, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";

export const videoMinutePeriod = pgTable("video_minute_period", {
  id: uuid("id").primaryKey().$defaultFn(generateId),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  includedAllowance: bigint("included_allowance", { mode: "number" }).notNull().default(0),
  purchasedBonus: bigint("purchased_bonus", { mode: "number" }).notNull().default(0),
  used: bigint("used", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videoMinuteUsageEvent = pgTable("video_minute_usage_event", {
  id: uuid("id").primaryKey().$defaultFn(generateId),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  periodId: uuid("period_id"),
  callSessionId: uuid("call_session_id"),
  participantMinutes: integer("participant_minutes").notNull().default(0),
  participantCount: integer("participant_count").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
