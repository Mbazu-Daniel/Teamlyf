import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "./references";
import { task } from "./task";

export const taskAttachment = pgTable("task_attachment", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  taskId: uuid("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
  memberId: memberReference("member_id"),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  size: text("size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("task_attachment_task_id_idx").on(t.taskId), index("task_attachment_member_id_idx").on(t.memberId)]);
