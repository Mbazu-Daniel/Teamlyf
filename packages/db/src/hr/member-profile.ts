import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { member } from "../organization/member";
import { organizationReference } from "../organization/membership-columns";

/** HR profile fields that are not part of the organization membership record. */
export const memberProfile = pgTable(
  "member_profile",
  {
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" })
      .primaryKey(),
    organizationId: organizationReference(),
    employeeNumber: text("employee_number"),
    jobTitle: text("job_title"),
    employmentType: text("employment_type").notNull().default("full_time"),
    status: text("status").notNull().default("active"),
    startDate: timestamp("start_date"),
    phone: text("phone"),
    address: text("address"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("member_profile_org_idx").on(table.organizationId)],
);
