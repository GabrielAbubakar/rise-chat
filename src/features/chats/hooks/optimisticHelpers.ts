import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { ConversationListResponseDto, ConversationResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

export interface OptimisticRollbackContext {
  previousList?: unknown;
  previousArchived?: unknown;
  previousDetail?: unknown;
  detailKey?: readonly unknown[];
  rollback?: (queryClient: QueryClient, userId: string | undefined) => void;
}

const compareConversations = (
  a: ConversationResponseDto,
  b: ConversationResponseDto,
): number => {
  const aPinned = a.settings?.pinned ? 1 : 0;
  const bPinned = b.settings?.pinned ? 1 : 0;
  if (aPinned !== bPinned) return bPinned - aPinned;
  const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
  const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
  return bTime - aTime;
};

const sortConversations = (items: ConversationResponseDto[]) => {
  items.sort(compareConversations);
};

/**
 * Optimistically toggles the pinned status of a conversation and re-sorts the list.
 */
export const optimisticallyTogglePin = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
  targetPinned: boolean,
): Promise<OptimisticRollbackContext> => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const previousList = queryClient.getQueryData(listKey);

  // Capture previous pinned state of the target conversation
  let previousPinned = !targetPinned;
  const currentData =
    queryClient.getQueryData<InfiniteData<ConversationListResponseDto>>(
      listKey,
    );
  const existingItem = currentData?.pages
    ?.flatMap((p) => p.items || [])
    .find((i) => i.id === conversationId);
  if (existingItem?.settings) {
    previousPinned = !!existingItem.settings.pinned;
  }

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
    listKey,
    (oldData) => {
      if (!oldData || !oldData.pages) return oldData;

      const allItems: ConversationResponseDto[] = oldData.pages.flatMap(
        (p) => p.items || [],
      );

      const updatedItems = allItems.map((item) => {
        if (item.id === conversationId) {
          return {
            ...item,
            settings: {
              ...item.settings,
              pinned: targetPinned,
            },
          };
        }
        return item;
      });

      sortConversations(updatedItems);

      const newPages = oldData.pages.map((page: any, index: number) => {
        if (index === 0) {
          return { ...page, items: updatedItems };
        }
        return { ...page, items: [] };
      });

      return { ...oldData, pages: newPages };
    },
  );

  return {
    previousList,
    rollback: (qc, uid) => {
      const targetListKey = [...chatsKeys.list(), uid];
      qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
        targetListKey,
        (currentCache) => {
          if (!currentCache || !currentCache.pages) return currentCache;

          const allItems: ConversationResponseDto[] =
            currentCache.pages.flatMap((p) => p.items || []);

          const revertedItems = allItems.map((item) => {
            if (item.id === conversationId) {
              return {
                ...item,
                settings: {
                  ...item.settings,
                  pinned: previousPinned,
                },
              };
            }
            return item;
          });

          sortConversations(revertedItems);

          const newPages = currentCache.pages.map(
            (page: any, index: number) => {
              if (index === 0) {
                return { ...page, items: revertedItems };
              }
              return { ...page, items: [] };
            },
          );

          return { ...currentCache, pages: newPages };
        },
      );
    },
  };
};

type ConversationListKind = "list" | "archived";
type ConversationPages = InfiniteData<ConversationListResponseDto>;

const listKeyFor = (kind: ConversationListKind, userId: string | undefined) =>
  kind === "list"
    ? [...chatsKeys.list(), userId]
    : [...chatsKeys.archived(), userId];

const findInList = (
  qc: QueryClient,
  key: readonly unknown[],
  conversationId: string,
): ConversationResponseDto | undefined =>
  qc
    .getQueryData<ConversationPages>(key)
    ?.pages?.flatMap((p) => p.items || [])
    .find((i) => i.id === conversationId);

const removeFromList = (
  qc: QueryClient,
  key: readonly unknown[],
  conversationId: string,
) => {
  qc.setQueryData<ConversationPages>(key, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: (page.items || []).filter((i) => i.id !== conversationId),
      })),
    };
  });
};

/**
 * Inserts at the sorted position without flattening pages, so page sizes and
 * cursors stay meaningful. If the item sorts after everything loaded and more
 * pages exist, it belongs to an unloaded page: leave it for the refetch.
 * An unloaded list is left unloaded (no partial "complete" list is invented).
 */
const insertSorted = (
  qc: QueryClient,
  key: readonly unknown[],
  item: ConversationResponseDto,
) => {
  qc.setQueryData<ConversationPages>(key, (old) => {
    if (!old?.pages || old.pages.length === 0) return old;
    const pages = old.pages.map((page) => ({
      ...page,
      items: [...(page.items || [])],
    }));
    for (const page of pages) {
      const index = page.items.findIndex(
        (existing) => compareConversations(item, existing) < 0,
      );
      if (index !== -1) {
        page.items.splice(index, 0, item);
        return { ...old, pages };
      }
    }
    const lastPage = pages[pages.length - 1];
    if (lastPage.pageInfo?.hasNextPage) return old;
    lastPage.items.push(item);
    return { ...old, pages };
  });
};

/**
 * Moves a conversation into the `to` list and marks it archived/unarchived in
 * both lists and the detail cache.
 *
 * R3: it always moves the LATEST cached row (which may carry newer fields such
 * as muted or latestMessage written while the request was in flight) and only
 * changes `settings.archived`. `fallback` (the row captured when the action
 * started) is used only if the row is no longer cached anywhere.
 */
const moveConversation = (
  qc: QueryClient,
  userId: string | undefined,
  conversationId: string,
  to: ConversationListKind,
  fallback?: ConversationResponseDto | null,
) => {
  const from: ConversationListKind = to === "list" ? "archived" : "list";
  const toKey = listKeyFor(to, userId);
  const fromKey = listKeyFor(from, userId);
  const detailKey = [...chatsKeys.detail(conversationId), userId];
  const archived = to === "archived";

  const latest =
    findInList(qc, toKey, conversationId) ??
    findInList(qc, fromKey, conversationId) ??
    qc.getQueryData<ConversationResponseDto>(detailKey) ??
    fallback ??
    undefined;

  // Remove from both so a row re-added elsewhere (e.g. by realtime) isn't duplicated
  removeFromList(qc, fromKey, conversationId);
  removeFromList(qc, toKey, conversationId);
  if (latest) {
    insertSorted(qc, toKey, {
      ...latest,
      settings: { ...latest.settings, archived },
    });
  }

  qc.setQueryData<ConversationResponseDto>(detailKey, (detail) =>
    detail
      ? { ...detail, settings: { ...detail.settings, archived } }
      : detail,
  );
};

const optimisticallyMove = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
  to: ConversationListKind,
): Promise<OptimisticRollbackContext> => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const from: ConversationListKind = to === "list" ? "archived" : "list";
  const detailKey = [...chatsKeys.detail(conversationId), userId];
  const previousList = queryClient.getQueryData(listKeyFor("list", userId));
  const previousArchived = queryClient.getQueryData(listKeyFor("archived", userId));
  const previousDetail = queryClient.getQueryData(detailKey);
  const snapshot =
    findInList(queryClient, listKeyFor(from, userId), conversationId) ??
    (previousDetail as ConversationResponseDto | undefined) ??
    null;

  moveConversation(queryClient, userId, conversationId, to);

  return {
    previousList,
    previousArchived,
    previousDetail,
    detailKey,
    rollback: (qc, uid) =>
      moveConversation(qc, uid, conversationId, from, snapshot),
  };
};

/**
 * Optimistically archives a conversation (moves it from the active list to the
 * archived list). Rollback moves the latest version of the row back.
 */
export const optimisticallyArchive = (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
): Promise<OptimisticRollbackContext> =>
  optimisticallyMove(queryClient, userId, conversationId, "archived");

/**
 * Optimistically unarchives a conversation (moves it from the archived list to
 * the active list). Rollback moves the latest version of the row back.
 */
export const optimisticallyUnarchive = (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
): Promise<OptimisticRollbackContext> =>
  optimisticallyMove(queryClient, userId, conversationId, "list");

/**
 * Optimistically toggles the muted status of a conversation.
 */
export const optimisticallyToggleMute = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
  targetMuted: boolean,
): Promise<OptimisticRollbackContext> => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const previousList = queryClient.getQueryData(listKey);

  const detailKey = [...chatsKeys.detail(conversationId), userId];
  const previousDetail = queryClient.getQueryData(detailKey);

  // Capture prior mute settings of target conversation
  let previousMuted = !targetMuted;
  let previousMutedUntil: string | null = null;

  const currentData =
    queryClient.getQueryData<InfiniteData<ConversationListResponseDto>>(
      listKey,
    );
  const existingItem = currentData?.pages
    ?.flatMap((p) => p.items || [])
    .find((i) => i.id === conversationId);
  if (existingItem?.settings) {
    previousMuted = !!existingItem.settings.muted;
    previousMutedUntil = existingItem.settings.mutedUntil ?? null;
  } else if ((previousDetail as ConversationResponseDto)?.settings) {
    const detailSettings = (previousDetail as ConversationResponseDto).settings;
    previousMuted = !!detailSettings.muted;
    previousMutedUntil = detailSettings.mutedUntil ?? null;
  }

  // 1. Optimistically update conversations list
  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
    listKey,
    (oldData) => {
      if (!oldData || !oldData.pages) return oldData;

      const newPages = oldData.pages.map((page) => ({
        ...page,
        items: (page.items || []).map((item: ConversationResponseDto) => {
          if (item.id === conversationId) {
            return {
              ...item,
              settings: {
                ...item.settings,
                muted: targetMuted,
                mutedUntil: targetMuted ? "2099-01-01T00:00:00.000Z" : null,
              },
            };
          }
          return item;
        }),
      }));

      return { ...oldData, pages: newPages };
    },
  );

  // 2. Optimistically update conversation detail
  queryClient.setQueryData<ConversationResponseDto>(detailKey, (oldDetail) => {
    if (!oldDetail) return oldDetail;
    return {
      ...oldDetail,
      settings: {
        ...oldDetail.settings,
        muted: targetMuted,
        mutedUntil: targetMuted ? "2099-01-01T00:00:00.000Z" : null,
      },
    };
  });

  return {
    previousList,
    previousDetail,
    detailKey,
    rollback: (qc, uid) => {
      const targetListKey = [...chatsKeys.list(), uid];
      const targetDetailKey = [...chatsKeys.detail(conversationId), uid];

      // Revert only this conversation in active list
      qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
        targetListKey,
        (currentCache) => {
          if (!currentCache || !currentCache.pages) return currentCache;
          return {
            ...currentCache,
            pages: currentCache.pages.map((page) => ({
              ...page,
              items: (page.items || []).map((item: ConversationResponseDto) => {
                if (item.id === conversationId) {
                  return {
                    ...item,
                    settings: {
                      ...item.settings,
                      muted: previousMuted,
                      mutedUntil: previousMutedUntil,
                    },
                  };
                }
                return item;
              }),
            })),
          };
        },
      );

      // Revert detail query
      qc.setQueryData<ConversationResponseDto>(
        targetDetailKey,
        (currentDetail) => {
          if (!currentDetail) return currentDetail;
          return {
            ...currentDetail,
            settings: {
              ...currentDetail.settings,
              muted: previousMuted,
              mutedUntil: previousMutedUntil,
            },
          };
        },
      );
    },
  };
};
