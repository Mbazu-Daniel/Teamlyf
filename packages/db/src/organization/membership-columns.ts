import { uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "./organization";

export function userReference(columnName: string) {
  return uuid(columnName).notNull().references(() => user.id, { onDelete: "cascade" });
}

export function organizationReference() {
  return uuid("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" });
}
