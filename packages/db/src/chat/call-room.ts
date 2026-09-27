import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";
import { channel } from "./channel";

export type CallRoomSettings = {
  isLobbyEnabled?: boolean;
  isGuestJoinEnabled?: boolean;
  isMutedByDefault?: boolean;
  noiseSuppressionEnabled?: boolean;
  virtualBackgroundEnabled?: boolean;
  maxParticipants?: number;
};

export const callRoom = pgTable(
  "call_room",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdById: uuid("created_by_id").references(() => member.id, { onDelete: "set null" }),
    channelId: uuid("channel_id").references(() => channel.id, { onDelete: "cascade" }),
    settings: jsonb("settings").$type<CallRoomSettings>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUidx: index("call_room_slug_uidx").on(table.slug),
    orgIdx: index("call_room_organization_idx").on(table.organizationId),
  }),
);
