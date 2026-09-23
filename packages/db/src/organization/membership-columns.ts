import { uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { member } from "./member";
import { organization } from "./organization";

export function userReference(columnName: string) {
  return uuid(columnName).notNull().references(() => user.id, { onDelete: "cascade" });
}

export function memberReference(columnName = "member_id", required = true) {
  const column = uuid(columnName).references(() => member.id, { onDelete: "cascade" });
  return required ? column.notNull() : column;
}

export function organizationReference() {
  return uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" });
}
