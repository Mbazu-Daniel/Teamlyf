import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { channel } from "./channel";
import { member } from "../organization/member";

export const message = pgTable("message", {
  id: text("id").primaryKey().$defaultFn(generateId),
  channelId: text("channel_id").notNull().references(() => channel.id, { onDelete: "cascade" }),
  senderKind: text("sender_kind").notNull().default("member"),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  threadRootId: text("thread_root_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  channelCreatedIdx: index("message_channel_created_idx").on(table.channelId, table.createdAt),
  threadIdx: index("message_thread_idx").on(table.threadRootId),
}));