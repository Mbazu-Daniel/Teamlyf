import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { member } from "../organization/member";

/**
 * Polymorphic over message kinds: `messageId` is a channel message id or a
 * direct message id, told apart by `messageType`, so it carries no foreign key.
 */
export const messageReaction = pgTable(
  "message_reaction",
  {
    organizationId: uuid("organization_id").notNull(),
    messageId: uuid("message_id").notNull(),
    messageType: text("message_type").notNull().default("channel"),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.memberId, table.emoji] }),
    messageIdx: index("message_reaction_message_idx").on(table.messageId),
    orgIdx: index("message_reaction_organization_idx").on(table.organizationId),
  }),
);
