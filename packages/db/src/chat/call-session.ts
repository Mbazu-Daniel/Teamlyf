import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";
import { channel } from "./channel";
import { callRoom } from "./call-room";

export type CallSessionSettings = {
  isGuestJoinEnabled?: boolean;
  isLobbyEnabled?: boolean;
  isMutedByDefault?: boolean;
  noiseSuppressionEnabled?: boolean;
  virtualBackgroundEnabled?: boolean;
};

export const callSession = pgTable(
  "call_session",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => callRoom.id, { onDelete: "set null" }),
    /** LiveKit room name — unique so joins address one live session. */
    roomName: text("room_name").notNull(),
    callType: text("call_type").notNull().default("direct"),
    status: text("status").notNull().default("initiated"),
    settings: jsonb("settings").$type<CallSessionSettings>().notNull().default({}),
    isRecording: boolean("is_recording").notNull().default(false),
    recordingId: text("recording_id"),
    recordingUrl: text("recording_url"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    initiatorId: uuid("initiator_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id").references(() => channel.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id").references(() => member.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    duration: integer("duration"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomNameUidx: index("call_session_room_name_uidx").on(table.roomName),
    orgIdx: index("call_session_organization_idx").on(table.organizationId),
    initiatorIdx: index("call_session_initiator_idx").on(table.initiatorId),
    channelIdx: index("call_session_channel_idx").on(table.channelId),
    recipientIdx: index("call_session_recipient_idx").on(table.recipientId),
  }),
);
