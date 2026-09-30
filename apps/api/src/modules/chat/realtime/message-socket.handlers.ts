import type { Database } from "@teamlyf/db";
import { directMessage, message } from "@teamlyf/db";
import { eq } from "drizzle-orm";
import type { ChannelMessageWriterService } from "../channels/channel-message-writer.service";
import type { DirectMessagesService } from "../direct-messages/direct-messages.service";
import type { MessageReactionsService } from "../reactions/message-reactions.service";
import { CHAT_ROOMS } from "../shared/rooms";
import {
  errorMessage,
  validId,
  validIds,
  type DeleteMessagePayload,
  type ReactionPayload,
  type SendChannelMessagePayload,
  type SendDirectMessagePayload,
} from "./socket-payloads";
import type { AuthenticatedSocket } from "./ws-auth";
import { broadcastChannel } from "./channel-broadcast";

export type MessageSocketDeps = {
  db: Database;
  writer: ChannelMessageWriterService;
  dm: DirectMessagesService;
  reactions: MessageReactionsService;
  stopTypingBroadcast: (client: AuthenticatedSocket, room: string) => Promise<void>;
};

export async function sendChannelMessage(
  client: AuthenticatedSocket,
  data: SendChannelMessagePayload,
  deps: MessageSocketDeps,
): Promise<unknown> {
  try {
    const channelId = data?.channelId;
    const content = data?.content;
    if (
      typeof channelId !== "string" ||
      !channelId ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return { success: false, error: "channelId and content are required" };
    }
    const messageRow = await deps.writer.createChannelMessage({
      organizationId: client.data.organizationId,
      channelId,
      senderId: client.data.memberId,
      content,
      attachmentIds: validIds(data?.attachmentIds),
      parentMessageId: validId(data?.parentMessageId),
    });
    await deps.stopTypingBroadcast(client, CHAT_ROOMS.channel(channelId));
    await broadcastChannel(deps.db, client, channelId, "new-channel-message", {
      channelId,
      message: messageRow,
    });
    return { success: true, message: messageRow };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function sendDirectMessage(
  client: AuthenticatedSocket,
  data: SendDirectMessagePayload,
  deps: MessageSocketDeps,
): Promise<unknown> {
  try {
    const recipientId = data?.recipientId;
    const content = data?.content;
    if (
      typeof recipientId !== "string" ||
      !recipientId ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return { success: false, error: "recipientId and content are required" };
    }
    const messageRow = await deps.dm.createDirectMessage({
      organizationId: client.data.organizationId,
      senderId: client.data.memberId,
      recipientId,
      content,
      attachmentIds: validIds(data?.attachmentIds),
      parentMessageId: validId(data?.parentMessageId),
    });
    await deps.stopTypingBroadcast(client, CHAT_ROOMS.member(recipientId));
    client.nsp.to(CHAT_ROOMS.member(recipientId)).emit("new-direct-message", {
      conversationId: client.data.memberId,
      message: { ...messageRow, conversationId: client.data.memberId, isCurrentUserMessage: false },
    });
    return { success: true, message: messageRow };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteMessage(
  client: AuthenticatedSocket,
  data: DeleteMessagePayload,
  deps: MessageSocketDeps,
): Promise<unknown> {
  try {
    const parsed = parseMessageKind(data);
    if (!parsed) return { success: false, error: "messageId and a valid messageType are required" };
    const { messageId, messageType } = parsed;
    const { memberId, organizationId } = client.data;

    if (messageType === "channel") {
      const deleted = await deps.writer.deleteChannelMessage(organizationId, memberId, messageId);
      const row = await deps.db.query.message.findFirst({ where: eq(message.id, messageId) });
      if (row?.channelId) {
        await broadcastChannel(
          deps.db,
          client,
          row.channelId,
          "message-deleted",
          {
            messageId: deleted.messageId,
            parentMessageId: deleted.parentMessageId ?? undefined,
          },
          true,
        );
      }
    } else {
      const row = await deps.db.query.directMessage.findFirst({
        where: eq(directMessage.id, messageId),
      });
      if (row && (row.senderId === memberId || row.recipientId === memberId)) {
        const deleted = await deps.dm.deleteDirectMessage(organizationId, memberId, messageId);
        for (const viewerId of [row.senderId, row.recipientId]) {
          client.nsp.to(CHAT_ROOMS.member(viewerId)).emit("direct-message-deleted", {
            messageId: deleted.messageId,
            parentMessageId: deleted.parentMessageId ?? undefined,
          });
        }
      } else {
        return { success: false, error: "Message not found" };
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function applyReaction(
  client: AuthenticatedSocket,
  data: ReactionPayload,
  add: boolean,
  deps: MessageSocketDeps,
): Promise<unknown> {
  try {
    const parsed = parseMessageKind(data);
    if (!parsed || typeof data?.reaction !== "string" || !data.reaction) {
      return { success: false, error: "messageId, messageType and reaction are required" };
    }
    const { messageId, messageType } = parsed;
    const { memberId, organizationId } = client.data;
    const args = { organizationId, messageType, messageId, memberId, reaction: data.reaction };
    const event = add
      ? await deps.reactions.addReaction(args)
      : await deps.reactions.removeReaction(args);

    if (messageType === "channel") {
      const row = await deps.db.query.message.findFirst({ where: eq(message.id, messageId) });
      if (row?.channelId) {
        await broadcastChannel(
          deps.db,
          client,
          row.channelId,
          add ? "reaction-added" : "reaction-removed",
          event,
        );
      }
    } else {
      const row = await deps.db.query.directMessage.findFirst({
        where: eq(directMessage.id, messageId),
      });
      if (row && (row.senderId === memberId || row.recipientId === memberId)) {
        const otherId = row.senderId === memberId ? row.recipientId : row.senderId;
        client.nsp
          .to(CHAT_ROOMS.member(otherId))
          .emit(add ? "reaction-added" : "reaction-removed", event);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

function parseMessageKind(data: ReactionPayload | DeleteMessagePayload): {
  messageId: string;
  messageType: "channel" | "direct";
} | null {
  const messageId =
    typeof data?.messageId === "string" && data.messageId ? data.messageId : undefined;
  const messageType = data?.messageType;
  if (!messageId || (messageType !== "channel" && messageType !== "direct")) return null;
  return { messageId, messageType };
}
