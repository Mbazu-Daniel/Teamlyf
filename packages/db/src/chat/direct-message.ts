import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "../organization";

export const directMessage = pgTable("direct_message", {
  id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
  organizationId: organizationReference(),
  senderId: memberReference("sender_id"),
  recipientId: memberReference("recipient_id"),
  content: text("content").notNull(),
  parentMessageId: uuid("parent_message_id"),
  readAt: timestamp("read_at"),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [index("direct_message_organization_id_idx").on(t.organizationId), index("direct_message_sender_id_idx").on(t.senderId), index("direct_message_recipient_id_idx").on(t.recipientId), index("direct_message_parent_message_id_idx").on(t.parentMessageId)]);
