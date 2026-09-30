import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { channel } from "./channel";
import { generateId } from "../id";

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channel.id, { onDelete: "cascade" }),
    senderKind: text("sender_kind").notNull().default("member"),
    senderId: uuid("sender_id").notNull(),
    content: text("content").notNull(),
    threadRootId: uuid("thread_root_id"),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    messageType: text("message_type").notNull().default("text"),
    systemEventData: jsonb("system_event_data"),
    isPinned: boolean("is_pinned").notNull().default(false),
    linkPreviews: jsonb("link_previews"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    channelCreatedIdx: index("message_channel_created_idx").on(table.channelId, table.createdAt),
    threadIdx: index("message_thread_idx").on(table.threadRootId),
    threadRootFk: foreignKey({
      columns: [table.threadRootId],
      foreignColumns: [table.id],
      name: "message_thread_root_id_message_id_fk",
    }).onDelete("cascade"),
  }),
);
