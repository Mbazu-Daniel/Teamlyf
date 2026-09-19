import { uuid } from "drizzle-orm/pg-core";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

export function organizationReference() {
  return uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });
}

export function memberReference(columnName = "member_id") {
  return uuid(columnName)
    .notNull()
    .references(() => member.id, { onDelete: "cascade" });
}
