import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { message } from "./message";
import { member } from "../organization/member";

export const messageReaction = pgTable("message_reaction", {
  messageId: uuid("message_id").notNull().references(() => message.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.messageId, table.memberId, table.emoji] }),
  messageIdx: index("message_reaction_message_idx").on(table.messageId),
}));
