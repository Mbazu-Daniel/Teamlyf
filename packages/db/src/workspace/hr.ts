import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, memberReference } from "../project/references";
import { member } from "../organization/member";

export const employee = pgTable(
  "employee",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    memberId: uuid("member_id").references(() => member.id, { onDelete: "set null" }),
    managerId: uuid("manager_id"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    jobTitle: text("job_title"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("employee_organization_id_idx").on(t.organizationId), index("employee_manager_id_idx").on(t.managerId)],
);

export const leaveRequest = pgTable(
  "leave_request",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    employeeId: uuid("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
    requestedById: memberReference("requested_by_id"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    reason: text("reason"),
    status: text("status").notNull().default("pending"),
    reviewedById: uuid("reviewed_by_id").references(() => member.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("leave_request_employee_id_idx").on(t.employeeId)],
);
