import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";

export const leavePolicy = pgTable("leave_policy", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  name: text("name").notNull(),
  daysPerYear: integer("days_per_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("leave_policy_org_idx").on(t.organizationId)]);

export const leaveRequest = pgTable("leave_request", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  memberId: uuid("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  policyId: uuid("policy_id").notNull().references(() => leavePolicy.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  reviewedById: uuid("reviewed_by_id").references(() => member.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("leave_request_org_idx").on(t.organizationId),
  index("leave_request_member_idx").on(t.memberId),
]);
