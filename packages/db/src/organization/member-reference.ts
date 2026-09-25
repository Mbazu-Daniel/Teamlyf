import { uuid } from "drizzle-orm/pg-core";
import { member } from "./member";

/** FK to `member`. Lives apart from `membership-columns` so it never cycles back into `member`. */
export function memberReference(columnName = "member_id", required = true) {
  const column = uuid(columnName).references(() => member.id, { onDelete: "cascade" });
  return required ? column.notNull() : column;
}
