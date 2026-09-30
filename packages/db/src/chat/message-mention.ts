import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

export const messageMention = pgTable(
  "message_mention",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull(),
    messageType: text("message_type").notNull().default("channel"),
    mentionedMemberId: uuid("mentioned_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    mentionedById: uuid("mentioned_by_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    memberIdx: index("message_mention_member_idx").on(
      table.organizationId,
      table.mentionedMemberId,
    ),
    messageIdx: index("message_mention_message_idx").on(table.messageId, table.messageType),
  }),
);
