import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference, memberReference } from "../project/references";

export const channel = pgTable(
  "channel",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("channel"),
    isPrivate: boolean("is_private").notNull().default(false),
    createdById: memberReference("created_by_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("channel_organization_id_idx").on(t.organizationId)],
);

export const channelMember = pgTable(
  "channel_member",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    channelId: uuid("channel_id").notNull().references(() => channel.id, { onDelete: "cascade" }),
    memberId: memberReference(),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("channel_member_unique_idx").on(t.channelId, t.memberId)],
);

export const message = pgTable(
  "message",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    channelId: uuid("channel_id").notNull().references(() => channel.id, { onDelete: "cascade" }),
    threadRootId: uuid("thread_root_id"),
    senderKind: text("sender_kind").notNull().default("member"),
    senderId: uuid("sender_id").notNull(),
    content: text("content").notNull(),
    mentions: text("mentions").notNull().default("[]"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("message_channel_created_idx").on(t.channelId, t.createdAt), index("message_thread_root_idx").on(t.threadRootId)],
);

export const messageReaction = pgTable(
  "message_reaction",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    messageId: uuid("message_id").notNull().references(() => message.id, { onDelete: "cascade" }),
    memberId: memberReference(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("message_reaction_unique_idx").on(t.messageId, t.memberId, t.emoji)],
);
