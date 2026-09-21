import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "../organization/membership-columns";

export const hrLeavePolicy = pgTable("hr_leave_policy", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  name: text("name").notNull(),
  daysPerYear: text("days_per_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("hr_leave_policy_org_idx").on(t.organizationId)]);

export const hrLeaveRequest = pgTable("hr_leave_request", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  memberId: memberReference(),
  policyId: uuid("policy_id").notNull().references(() => hrLeavePolicy.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  reviewedById: uuid("reviewed_by_id").references(() => undefined),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("hr_leave_request_org_idx").on(t.organizationId),
  index("hr_leave_request_member_idx").on(t.memberId),
]);
