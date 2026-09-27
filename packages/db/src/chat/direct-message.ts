import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

/**
 * One row per direct message. Conversations are derived from the pair
 * (sender, recipient) — there is no conversation table.
 */
export const directMessage = pgTable(
  "direct_message",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    parentMessageId: uuid("parent_message_id"),
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
    orgSenderIdx: index("direct_message_org_sender_idx").on(table.organizationId, table.senderId),
    orgRecipientIdx: index("direct_message_org_recipient_idx").on(
      table.organizationId,
      table.recipientId,
    ),
    pairIdx: index("direct_message_pair_idx").on(
      table.organizationId,
      table.senderId,
      table.recipientId,
      table.createdAt,
    ),
    parentIdx: index("direct_message_parent_idx").on(table.parentMessageId),
  }),
);
