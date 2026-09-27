import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { Message, MessageReaction, MessageResponse, TypingEvent, TypingUser } from "@/features/chat/types/messages/types";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import {
  appendMessageToInfiniteData,
  filterMessagesInInfiniteData,
  mapMessagesInInfiniteData,
  MessagesInfiniteData,
  patchMessagesInInfiniteCaches,
  upsertMessageInInfiniteData,
} from "../message-query-cache";

export function useChatEvents(
  tenantId: string,
  chatId: string,
  type: "channel" | "direct",
  token: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!tenantId || !token || !chatId || !enabled) return;

    const socket = getSocket(token, tenantId);

    const messageEvent =
      type === "channel"
        ? "new-channel-message"
        : "new-direct-message";

    const messagesPrefix = (id: string) =>
      type === "channel"
        ? queryKeys.chat.channelMessages(tenantId, id)
        : queryKeys.chat.directMessages(tenantId, id);

    const messageHandler = (message: MessageResponse) => {
      const isDisplayingCorrectChat = type === "channel"
        ? message.channelId === chatId
        : message.message.sender.id === chatId;

      if (isDisplayingCorrectChat) {
        const parentId = message.message.parentMessageId;

        if (parentId) {
          const threadCacheKey = queryKeys.chat.threadMessages(type, chatId, parentId);
          queryClient.setQueryData(threadCacheKey, (old: Message[] = []) => {
            if (old.some(m => m.id === message.message.id)) return old;
            return [...old, message.message];
          });

          patchMessagesInInfiniteCaches(
            queryClient,
            messagesPrefix(chatId),
            (old) =>
              mapMessagesInInfiniteData(old, (m) =>
                m.id === parentId
                  ? {
                      ...m,
                      threadCount: (m.threadCount || 0) + 1,
                      hasThreadedMessage: true,
                      lastReplyTime: message.message.createdAt,
                    }
                  : m,
              ),
          );
        } else {
          patchMessagesInInfiniteCaches(
            queryClient,
            messagesPrefix(chatId),
            (old) => {
              const existing = old?.pages?.some((p) =>
                p.messages?.some((m) => m.id === message.message.id),
              );
              if (existing) {
                return upsertMessageInInfiniteData(old, message.message);
              }

              const tempMatch = (m: Message) => {
                if (typeof m.id !== "number" || m.id >= 0) return false;
                if ((m.content || "").trim() !== (message.message.content || "").trim()) return false;
                const localCount = (m.attachments || []).length;
                const serverCount = (message.message.attachments || []).length || 0;
                return localCount === serverCount;
              };

              const hasTemp = old?.pages?.some((p) =>
                p.messages?.some(tempMatch),
              );
              if (hasTemp) {
                return upsertMessageInInfiniteData(old, message.message, tempMatch);
              }

              return appendMessageToInfiniteData(old, message.message);
            },
          );
        }
      } else {
        if (message.message.parentMessageId) {
          const parentId = message.message.parentMessageId;
          const bgChatId = type === "channel" ? message.channelId : message.message.sender.id;

          const threadCacheKey = queryKeys.chat.threadMessages(type, bgChatId ?? "", parentId);
          queryClient.setQueryData(threadCacheKey, (old: Message[] | undefined) => {
            if (!old) return old;
            if (old.some(m => m.id === message.message.id)) return old;
            return [...old, message.message];
          });

          patchMessagesInInfiniteCaches(
            queryClient,
            messagesPrefix(bgChatId!),
            (old) => {
              if (!old) return old;
              return mapMessagesInInfiniteData(old, (m) =>
                m.id === parentId
                  ? {
                      ...m,
                      threadCount: (m.threadCount || 0) + 1,
                      hasThreadedMessage: true,
                      lastReplyTime: message.message.createdAt,
                    }
                  : m,
              );
            },
          );
        } else {
          const bgChatId =
            type === "channel" ? message.channelId : message.message.sender.id;

          patchMessagesInInfiniteCaches(
            queryClient,
            messagesPrefix(bgChatId!),
            (old) => {
              if (!old) return old;
              if (old.pages.some((p) => p.messages?.some((m) => m.id === message.message.id))) {
                return old;
              }
              return appendMessageToInfiniteData(old, message.message);
            },
          );
        }
      }
    };

    const typingHandler = (data: TypingEvent | (string | TypingUser)[]) => {
      const users = Array.isArray(data) ? data : data.typingUsers || [];
      setTypingUsers(
        users
          .map((u) => (typeof u === "string" ? { id: Number(u) } : u))
          .filter((u): u is TypingUser => Boolean(u.id)),
      );
    };

    if (type === "channel") {
       socket.emit("join-channel", { channelId: chatId });
    }

    const reactionHandler = (data: { messageId: string, messageType: string, reaction: string, tenantMemberId: string }, isAdd: boolean) => {
      if (data.messageType !== type) return;

      const { messageId, reaction, tenantMemberId } = data;

      const reactionCacheKey = queryKeys.chat.messageReactions(tenantId, chatId, messageId);
      queryClient.setQueryData(reactionCacheKey, (oldReactions: MessageReaction[] = []) => {
        let newReactions = [...oldReactions];
        if (isAdd) {
          if (!newReactions.some(r => r.reaction === reaction && r.tenantMemberId === tenantMemberId)) {
            newReactions.push({ reaction, tenantMemberId });
          }
        } else {
          newReactions = newReactions.filter(r => !(r.reaction === reaction && r.tenantMemberId === tenantMemberId));
        }
        return newReactions;
      });

      patchMessagesInInfiniteCaches(
        queryClient,
        messagesPrefix(chatId),
        (old) =>
          mapMessagesInInfiniteData(old, (m) => {
            if (m.id !== messageId) return m;
            const currentReactions = m.reactions || [];
            let newReactions = [...currentReactions];
            if (isAdd) {
              if (!newReactions.some(r => r.reaction === reaction && r.tenantMemberId === tenantMemberId)) {
                newReactions.push({ reaction, tenantMemberId });
              }
            } else {
              newReactions = newReactions.filter(r => !(r.reaction === reaction && r.tenantMemberId === tenantMemberId));
            }
            return { ...m, reactions: newReactions };
          }),
      );
    };

    const deletionHandler = (data: { messageId: string, parentMessageId?: string }) => {
      const { messageId, parentMessageId } = data;
      const prefix = messagesPrefix(chatId);

      let deletedMessage: Message | undefined;
      const caches = queryClient.getQueriesData<MessagesInfiniteData>({ queryKey: prefix });
      for (const [, cache] of caches) {
        deletedMessage = cache?.pages
          ?.flatMap((p) => p.messages ?? [])
          .find((m) => m.id === messageId);
        if (deletedMessage) break;
      }

      if (!deletedMessage && parentMessageId) {
        const threadCacheKey = queryKeys.chat.threadMessages(type, chatId, parentMessageId);
        const threadMessages = queryClient.getQueryData<Message[]>(threadCacheKey);
        deletedMessage = threadMessages?.find(m => m.id === messageId);
      }

      const senderName = deletedMessage?.sender?.firstName || "Someone";
      toast.info(`${senderName} deleted a message`, {
        duration: 3000,
        position: "top-right",
      });

      patchMessagesInInfiniteCaches(queryClient, prefix, (old) =>
        filterMessagesInInfiniteData(old, (m) => m.id !== messageId),
      );

      if (parentMessageId) {
        const threadCacheKey = queryKeys.chat.threadMessages(type, chatId, parentMessageId);
        queryClient.setQueryData(threadCacheKey, (old: Message[] = []) =>
          old.filter(m => m.id !== messageId)
        );

        patchMessagesInInfiniteCaches(queryClient, prefix, (old) =>
          mapMessagesInInfiniteData(old, (m) => {
            if (m.id !== parentMessageId) return m;
            const newCount = Math.max(0, (m.threadCount || 0) - 1);
            return {
              ...m,
              threadCount: newCount,
              hasThreadedMessage: newCount > 0,
            };
          }),
        );
      }
    };

    socket.on(messageEvent, messageHandler);
    socket.on("user-typing", typingHandler);
    socket.on("reaction-added", (data) => reactionHandler(data, true));
    socket.on("reaction-removed", (data) => reactionHandler(data, false));
    socket.on(type === "channel" ? "message-deleted" : "direct-message-deleted", deletionHandler);

    return () => {
      socket.off(messageEvent, messageHandler);
      socket.off("user-typing", typingHandler);
      socket.off("reaction-added", (data) => reactionHandler(data, true));
      socket.off("reaction-removed", (data) => reactionHandler(data, false));
      socket.off(type === "channel" ? "message-deleted" : "direct-message-deleted", deletionHandler);
    };
  }, [tenantId, chatId, type, token, queryClient, enabled]);

  return {
    typingUsers,
  };
}
