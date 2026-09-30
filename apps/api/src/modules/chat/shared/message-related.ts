import type { Database } from "@teamlyf/db";
import { directMessage, message, messageAttachment, messageReaction } from "@teamlyf/db";
import { and, count, desc, eq, inArray, max, or } from "drizzle-orm";
import type {
  ChatAttachmentRow,
  ChatMessageKind,
  ChatReactionRow,
  ChatThreadStats,
} from "./message.mapper";

type Ids = string[];

function toStatsMap(
  rows: { rootId: string | null; replyCount: number | string; lastReply: Date | string | null }[],
): Map<string, ChatThreadStats> {
  return new Map(
    rows
      .filter((row): row is typeof row & { rootId: string } => row.rootId !== null)
      .map((row) => [
        row.rootId,
        {
          count: Number(row.replyCount),
          lastReplyTime: row.lastReply ? new Date(row.lastReply) : null,
        },
      ]),
  );
}

async function channelThreadStats(
  db: Database,
  rootIds: Ids,
): Promise<Map<string, ChatThreadStats>> {
  if (rootIds.length === 0) return new Map();
  const rows = await db
    .select({
      rootId: message.threadRootId,
      replyCount: count(),
      lastReply: max(message.createdAt),
    })
    .from(message)
    .where(inArray(message.threadRootId, rootIds))
    .groupBy(message.threadRootId);
  return toStatsMap(rows);
}

async function directThreadStats(
  db: Database,
  parentIds: Ids,
): Promise<Map<string, ChatThreadStats>> {
  if (parentIds.length === 0) return new Map();
  const rows = await db
    .select({
      rootId: directMessage.parentMessageId,
      replyCount: count(),
      lastReply: max(directMessage.createdAt),
    })
    .from(directMessage)
    .where(inArray(directMessage.parentMessageId, parentIds))
    .groupBy(directMessage.parentMessageId);
  return toStatsMap(rows);
}

export function loadThreadStats(
  db: Database,
  kind: ChatMessageKind,
  rootIds: Ids,
): Promise<Map<string, ChatThreadStats>> {
  return kind === "channel" ? channelThreadStats(db, rootIds) : directThreadStats(db, rootIds);
}

export async function loadAttachments(
  db: Database,
  organizationId: string,
  selection: { channelMessageIds?: Ids; directMessageIds?: Ids },
): Promise<Map<string, ChatAttachmentRow[]>> {
  const channelIds = selection.channelMessageIds ?? [];
  const directIds = selection.directMessageIds ?? [];
  if (channelIds.length === 0 && directIds.length === 0) return new Map();

  const rows = await db
    .select({
      channelMessageId: messageAttachment.channelMessageId,
      directMessageId: messageAttachment.directMessageId,
      fileKey: messageAttachment.fileKey,
      originalFileName: messageAttachment.originalFileName,
      mimeType: messageAttachment.mimeType,
      fileSize: messageAttachment.fileSize,
    })
    .from(messageAttachment)
    .where(
      and(
        eq(messageAttachment.organizationId, organizationId),
        or(
          channelIds.length > 0
            ? inArray(messageAttachment.channelMessageId, channelIds)
            : undefined,
          directIds.length > 0 ? inArray(messageAttachment.directMessageId, directIds) : undefined,
        ),
      ),
    );

  const channelSet = new Set(channelIds);
  const directSet = new Set(directIds);
  const grouped = new Map<string, ChatAttachmentRow[]>();

  for (const row of rows) {
    const key =
      (row.channelMessageId && channelSet.has(row.channelMessageId) && row.channelMessageId) ||
      (row.directMessageId && directSet.has(row.directMessageId) && row.directMessageId);
    if (!key) continue;

    const entry: ChatAttachmentRow = {
      fileKey: row.fileKey,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
    };
    const bucket = grouped.get(key);
    if (bucket) bucket.push(entry);
    else grouped.set(key, [entry]);
  }

  return grouped;
}

export async function loadReactions(
  db: Database,
  organizationId: string,
  kind: ChatMessageKind,
  messageIds: Ids,
): Promise<Map<string, ChatReactionRow[]>> {
  if (messageIds.length === 0) return new Map();

  const rows = await db
    .select({
      messageId: messageReaction.messageId,
      emoji: messageReaction.emoji,
      memberId: messageReaction.memberId,
    })
    .from(messageReaction)
    .where(
      and(
        eq(messageReaction.organizationId, organizationId),
        eq(messageReaction.messageType, kind),
        inArray(messageReaction.messageId, messageIds),
      ),
    )
    .orderBy(desc(messageReaction.createdAt));

  const grouped = new Map<string, ChatReactionRow[]>();
  for (const row of rows) {
    const entry: ChatReactionRow = { emoji: row.emoji, memberId: row.memberId };
    const bucket = grouped.get(row.messageId);
    if (bucket) bucket.push(entry);
    else grouped.set(row.messageId, [entry]);
  }

  return grouped;
}
