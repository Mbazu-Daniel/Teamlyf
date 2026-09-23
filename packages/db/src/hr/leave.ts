import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership";

const memberReference = (columnName: string, required = true) => {
  const column = uuid(columnName).references(() => member.id, { onDelete: "cascade" });
  return required ? column.notNull() : column;
};

export const hrLeavePolicy = pgTable("hr_leave_policy", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  name: text("name").notNull(),
  daysPerYear: integer("days_per_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("hr_leave_policy_org_idx").on(t.organizationId)]);

export const hrLeaveRequest = pgTable("hr_leave_request", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  memberId: memberReference("member_id"),
  policyId: uuid("policy_id").notNull().references(() => hrLeavePolicy.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  reviewedById: memberReference("reviewed_by_id", false),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("hr_leave_request_org_idx").on(t.organizationId),
  index("hr_leave_request_member_idx").on(t.memberId),
]);
