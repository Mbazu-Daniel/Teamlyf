import { uuid } from "drizzle-orm/pg-core";
import { member } from "./member";
import { organization } from "./organization";
import { user } from "../auth/user";

export function userReference(columnName: string) {
  return uuid(columnName)
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
}

export function memberReference(columnName = "member_id") {
  return uuid(columnName)
    .notNull()
    .references(() => member.id, { onDelete: "cascade" });
}

export function organizationReference() {
  return uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });
}
