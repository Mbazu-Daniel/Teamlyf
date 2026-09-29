import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { taskActivity } from "./task-activity";
import { memberReference } from "./references";
export const notificationRead = pgTable("notification_read", {
  activityId: uuid("activity_id").notNull().references(() => taskActivity.id, { onDelete: "cascade" }),
  memberId: memberReference(),
  readAt: timestamp("read_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.activityId, table.memberId] })]);
