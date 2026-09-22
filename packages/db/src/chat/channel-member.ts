import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { channel } from "./channel";
import { member } from "../organization/member";

export const channelMember = pgTable("channel_member", {
  channelId: uuid("channel_id").notNull().references(() => channel.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.channelId, table.memberId] }),
  memberIdx: index("channel_member_member_idx").on(table.memberId),
}));
