import {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { PaginatedMessages } from "./chat-api";
import { Message } from "@/features/chat/types/messages/types";

export type MessagesInfiniteData = InfiniteData<PaginatedMessages>;

export const DEFAULT_MESSAGE_LIMIT = 50;

function isMessagesInfiniteData(
  data: unknown,
): data is MessagesInfiniteData {
  return (
    !!data &&
    typeof data === "object" &&
    Array.isArray((data as MessagesInfiniteData).pages)
  );
}

/** Append a message to the newest page (pages[0] after DESC fetch + ASC sort). */
export function appendMessageToInfiniteData(
  data: MessagesInfiniteData | undefined,
  message: Message,
): MessagesInfiniteData | undefined {
  if (!data?.pages?.length) {
    return {
      pages: [
        {
          messages: [message],
          total: 1,
          page: 1,
          totalPages: 1,
        },
      ],
      pageParams: [undefined],
    };
  }

  const pages = [...data.pages];
  const first = pages[0];
  if (first.messages.some((m) => m.id === message.id)) {
    return data;
  }

  pages[0] = {
    ...first,
    messages: [...first.messages, message],
    total: typeof first.total === "number" ? first.total + 1 : first.total,
  };

  return { ...data, pages };
}

/** Replace or append a message in InfiniteData (e.g. temp → server ack). */
export function upsertMessageInInfiniteData(
  data: MessagesInfiniteData | undefined,
  message: Message,
  match?: (m: Message) => boolean,
): MessagesInfiniteData | undefined {
  if (!isMessagesInfiniteData(data)) {
    return appendMessageToInfiniteData(undefined, message);
  }

  const matcher =
    match ??
    ((m: Message) => m.id === message.id);

  let found = false;
  const pages = data.pages.map((page) => {
    const idx = page.messages.findIndex(matcher);
    if (idx === -1) return page;
    found = true;
    const messages = [...page.messages];
    messages[idx] = message;
    return { ...page, messages };
  });

  if (found) return { ...data, pages };
  return appendMessageToInfiniteData(data, message);
}

export function mapMessagesInInfiniteData(
  data: MessagesInfiniteData | undefined,
  mapper: (message: Message) => Message,
): MessagesInfiniteData | undefined {
  if (!isMessagesInfiniteData(data)) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: (page.messages ?? []).map(mapper),
    })),
  };
}

export function filterMessagesInInfiniteData(
  data: MessagesInfiniteData | undefined,
  predicate: (message: Message) => boolean,
): MessagesInfiniteData | undefined {
  if (!isMessagesInfiniteData(data)) return data;
  return {
    ...data,
    pages: data.pages.map((page) => {
      const before = page.messages?.length ?? 0;
      const messages = (page.messages ?? []).filter(predicate);
      const removed = before - messages.length;
      return {
        ...page,
        messages,
        total:
          typeof page.total === "number"
            ? Math.max(0, page.total - removed)
            : page.total,
      };
    }),
  };
}

export function patchMessagesInInfiniteCaches(
  queryClient: QueryClient,
  queryKeyPrefix: QueryKey,
  updater: (
    data: MessagesInfiniteData | undefined,
  ) => MessagesInfiniteData | undefined,
) {
  queryClient.setQueriesData<MessagesInfiniteData>(
    { queryKey: queryKeyPrefix },
    (old) => {
      if (old !== undefined && !isMessagesInfiniteData(old)) return old;
      return updater(old);
    },
  );
}

export function flattenMessagePages(
  data: MessagesInfiniteData | undefined,
): Message[] {
  if (!data?.pages?.length) return [];
  // pages[0] = newest window; reverse so UI is oldest → newest
  return [...data.pages]
    .reverse()
    .flatMap((p) => p?.messages ?? []);
}
