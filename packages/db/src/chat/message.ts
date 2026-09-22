import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { channel } from "./channel";
import { generateId } from "../id";

export const message = pgTable("message", {
  id: uuid("id").primaryKey().$defaultFn(generateId),
  channelId: uuid("channel_id").notNull().references(() => channel.id, { onDelete: "cascade" }),
  senderKind: text("sender_kind").notNull().default("member"),
  senderId: uuid("sender_id").notNull(),
  content: text("content").notNull(),
  threadRootId: uuid("thread_root_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  channelCreatedIdx: index("message_channel_created_idx").on(table.channelId, table.createdAt),
  threadIdx: index("message_thread_idx").on(table.threadRootId),
}));
