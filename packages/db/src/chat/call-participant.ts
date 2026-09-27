import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { callSession } from "./call-session";

export type CallParticipantMetadata = {
  image?: string;
  isMuted?: boolean;
  forceMuted?: boolean;
};

export const callParticipant = pgTable(
  "call_participant",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    callSessionId: uuid("call_session_id")
      .notNull()
      .references(() => callSession.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => member.id, { onDelete: "set null" }),
    isGuest: boolean("is_guest").notNull().default(false),
    guestName: text("guest_name"),
    status: text("status").notNull().default("joined"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    wasPresent: timestamp("was_present", { withTimezone: true }),
    metadata: jsonb("metadata").$type<CallParticipantMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionIdx: index("call_participant_session_idx").on(table.callSessionId),
    memberIdx: index("call_participant_member_idx").on(table.memberId),
  }),
);
