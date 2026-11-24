import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { MessageHistoryResponseDto, MessageResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

type MessagesCache = InfiniteData<MessageHistoryResponseDto>;

const isMessagesCache = (data: unknown): data is MessagesCache =>
  !!data &&
  typeof data === "object" &&
  Array.isArray((data as MessagesCache).pages);

/** Version-aware merge: an older server snapshot never overwrites a newer one. */
export const isStaleSnapshot = (
  current: MessageResponseDto | undefined,
  incoming: MessageResponseDto,
) =>
  current?.version !== undefined &&
  incoming.version !== undefined &&
  incoming.version < current.version;

/**
 * Applies `updater` to one message wherever it is cached for this
 * conversation: the history pages and the single-message (reply target) query.
 */
export const updateMessageInCache = (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  updater: (message: MessageResponseDto) => MessageResponseDto,
) => {
  queryClient.setQueriesData<MessagesCache>(
    { queryKey: chatsKeys.messages(conversationId) },
    (oldData) => {
      // The messages prefix also matches the search query, which has another shape.
      if (!isMessagesCache(oldData)) return oldData;
      let changed = false;
      const pages = oldData.pages.map((page) => {
        if (!page.items.some((m) => m.id === messageId)) return page;
        changed = true;
        return {
          ...page,
          items: page.items.map((m) => (m.id === messageId ? updater(m) : m)),
        };
      });
      return changed ? { ...oldData, pages } : oldData;
    },
  );

  queryClient.setQueriesData<MessageResponseDto>(
    { queryKey: chatsKeys.message(conversationId, messageId) },
    (oldMessage) => (oldMessage ? updater(oldMessage) : oldMessage),
  );
};

/** Reads one message from the conversation's history cache. */
export const findCachedMessage = (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): MessageResponseDto | undefined => {
  const entries = queryClient.getQueriesData<MessagesCache>({
    queryKey: chatsKeys.messages(conversationId),
  });
  for (const [, data] of entries) {
    if (!isMessagesCache(data)) continue;
    for (const page of data.pages) {
      const found = page.items.find((m) => m.id === messageId);
      if (found) return found;
    }
  }
  return undefined;
};

/** Writes the server's copy of a message into the cache unless a newer one is already there. */
export const applyServerMessage = (
  queryClient: QueryClient,
  serverMessage: MessageResponseDto,
) => {
  updateMessageInCache(
    queryClient,
    serverMessage.conversationId,
    serverMessage.id,
    (current) =>
      isStaleSnapshot(current, serverMessage)
        ? current
        : { ...serverMessage, status: current.status ?? "sent" },
  );
};
