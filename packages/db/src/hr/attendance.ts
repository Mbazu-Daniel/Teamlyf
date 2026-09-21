import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "../organization/membership-columns";

export const hrAttendance = pgTable("hr_attendance", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  memberId: memberReference(),
  checkInAt: timestamp("check_in_at").notNull(),
  checkOutAt: timestamp("check_out_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("hr_attendance_org_idx").on(t.organizationId),
  index("hr_attendance_member_idx").on(t.memberId),
]);
