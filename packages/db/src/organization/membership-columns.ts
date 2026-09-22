import { uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/user";\nimport { member } from "./member";
import { organization } from "./organization";

export function userReference(columnName: string) {
  return uuid(columnName)
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
}

export function memberReference(columnName = "member_id") {\n  return uuid(columnName).notNull().references(() => member.id, { onDelete: "cascade" });\n}\n\nexport function organizationReference() {
  return uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });
}
