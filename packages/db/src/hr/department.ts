import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";

export const hrDepartment = pgTable("hr_department", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("hr_department_org_idx").on(t.organizationId),
  uniqueIndex("hr_department_org_name_idx").on(t.organizationId, t.name),
]);

export const hrDepartmentMember = pgTable("hr_department_member", {
  departmentId: uuid("department_id").notNull().references(() => hrDepartment.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("hr_department_member_member_idx").on(t.memberId)]);
