import { bigint, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organization } from "../organization/organization";
import { member } from "../organization/member";

export const messageAttachment = pgTable(
  "message_attachment",
  {
    id: uuid("id").primaryKey().$defaultFn(generateId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    directMessageId: uuid("direct_message_id"),
    channelMessageId: uuid("channel_message_id"),
    memberId: uuid("member_id").references(() => member.id, { onDelete: "set null" }),
    fileKey: text("file_key").notNull(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    directIdx: index("message_attachment_direct_idx").on(table.directMessageId),
    channelIdx: index("message_attachment_channel_idx").on(table.channelMessageId),
    orgIdx: index("message_attachment_organization_idx").on(table.organizationId),
    fileKeyUidx: index("message_attachment_file_key_uidx").on(table.fileKey),
  }),
);
