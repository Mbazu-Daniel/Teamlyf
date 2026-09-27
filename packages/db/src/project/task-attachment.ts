import { bigint, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "./references";
import { task } from "./task";

export const taskAttachment = pgTable(
  "task_attachment",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    organizationId: organizationReference(),
    // The uploader. Deleting an attachment is theirs alone, so the row records who owns the file.
    memberId: memberReference(),
    fileKey: text("file_key").notNull(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_attachment_task_id_idx").on(t.taskId),
    index("task_attachment_organization_id_idx").on(t.organizationId),
    index("task_attachment_member_id_idx").on(t.memberId),
    // One record per stored object: a repeated confirm cannot duplicate the file.
    uniqueIndex("task_attachment_file_key_uidx").on(t.fileKey),
  ],
);
