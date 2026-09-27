import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { Message } from "@/features/chat/types/messages/types";
import api from "@/features/chat/data/http";
import { logger } from "@/lib/utils/logger";
import { queryKeys } from "@/lib/queryKeys";
import {
  appendMessageToInfiniteData,
  patchMessagesInInfiniteCaches,
  upsertMessageInInfiniteData,
} from "../message-query-cache";

interface MessageHandlerResponse {
  success: boolean;
  error?: string;
  message: Message;
}

export function useSendMessage(tenantId: string, chatId: string, type: "channel" | "direct", token: string, parentMessageId?: string) {
  const queryClient = useQueryClient();

  return (content: string, attachmentIds?: string[], clientTempId?: string, mentionedUserIds?: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket(token, tenantId);

      const event = type === "channel" ? "send-channel-message" : "send-direct-message";
      const basePayload = type === "channel" ? { channelId: chatId } : { recipientId: chatId };
      const payload = { ...basePayload, content, attachmentIds, parentMessageId };

      let finished = false;
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          reject(new Error("Send message timeout"));
        }
      }, 30000);

      socket.emit(event, payload, (response?: MessageHandlerResponse) => {
        if (response?.success === false) {
          reject(new Error(response.error || "Failed to send message"));
          return;
        }
        if (finished) return;
        finished = true;
        clearTimeout(timeout);

        const serverMsg = response?.message;

        if (parentMessageId) {
          const threadCacheKey = queryKeys.chat.threadMessages(type, chatId, parentMessageId);
          if (serverMsg) {
            try {
              queryClient.setQueryData(threadCacheKey, (old: Message[] = []) => {
                if (clientTempId) {
                  const idx = old.findIndex((m: Message) => m.id === clientTempId);
                  if (idx !== -1) {
                    const updated = [...old];
                    updated[idx] = { ...serverMsg };
                    return updated;
                  }
                }
                const fallbackIdx = old.findIndex((m: Message) => {
                  if (!m.id || typeof m.id !== "number" || m.id >= 0) return false;
                  if ((m.content || "").trim() !== (serverMsg.content || "").trim()) return false;
                  const localCount = (m.attachments || []).length;
                  const serverCount = (serverMsg.attachments || serverMsg.attachmentIds || []).length || 0;
                  return localCount === serverCount;
                });
                if (fallbackIdx !== -1) {
                  const updated = [...old];
                  updated[fallbackIdx] = { ...serverMsg };
                  return updated;
                }
                return [...old, serverMsg];
              });
            } catch {
              queryClient.invalidateQueries({ queryKey: threadCacheKey });
            }
          } else {
            queryClient.invalidateQueries({ queryKey: threadCacheKey });
          }
        } else {
          const prefix =
            type === "channel"
              ? queryKeys.chat.channelMessages(tenantId, chatId)
              : queryKeys.chat.directMessages(tenantId, chatId);

          if (serverMsg) {
            try {
              patchMessagesInInfiniteCaches(queryClient, prefix, (old) => {
                if (clientTempId) {
                  const hasTemp = old?.pages?.some((p) =>
                    p.messages?.some((m) => m.id === clientTempId),
                  );
                  if (hasTemp) {
                    return upsertMessageInInfiniteData(
                      old,
                      serverMsg,
                      (m) => m.id === clientTempId,
                    );
                  }
                }

                const tempMatch = (m: Message) => {
                  if (!m.id || typeof m.id !== "number" || m.id >= 0) return false;
                  if ((m.content || "").trim() !== (serverMsg.content || "").trim()) return false;
                  const localCount = (m.attachments || []).length;
                  const serverCount = (serverMsg.attachments || serverMsg.attachmentIds || []).length || 0;
                  return localCount === serverCount;
                };

                const hasTemp = old?.pages?.some((p) =>
                  p.messages?.some(tempMatch),
                );
                if (hasTemp) {
                  return upsertMessageInInfiniteData(old, serverMsg, tempMatch);
                }

                return appendMessageToInfiniteData(old, serverMsg);
              });
            } catch {
              queryClient.invalidateQueries({ queryKey: prefix });
            }
          } else {
            queryClient.invalidateQueries({ queryKey: prefix });
          }
        }

        if (serverMsg && mentionedUserIds && mentionedUserIds.length > 0) {
          Promise.all(mentionedUserIds.map(userId =>
            api.post(`/organization/${tenantId}/message-mentions`, {
              messageId: serverMsg.id,
              messageType: type,
              mentionedUserId: userId
            })
          )).catch(err => logger.error("Failed to save mentions:", err));
        }

        resolve();
      });

      socket.once("disconnect", () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          reject(new Error("Socket disconnected during send"));
        }
      });
    });
  };
}
