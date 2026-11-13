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

const sortConversations = (items: ConversationResponseDto[]) => {
  items.sort((a, b) => {
    const aPinned = a.settings?.pinned ? 1 : 0;
    const bPinned = b.settings?.pinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return bTime - aTime;
  });
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

/**
 * Optimistically archives a conversation (removes from active list, adds to archived list).
 */
export const optimisticallyArchive = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
): Promise<OptimisticRollbackContext> => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const archivedKey = [...chatsKeys.archived(), userId];

  const previousList = queryClient.getQueryData(listKey);
  const previousArchived = queryClient.getQueryData(archivedKey);

  const currentList =
    queryClient.getQueryData<InfiniteData<ConversationListResponseDto>>(
      listKey,
    );
  const targetItem =
    currentList?.pages
      ?.flatMap((p) => p.items || [])
      .find((i) => i.id === conversationId) ?? null;

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
    listKey,
    (oldData) => {
      if (!oldData || !oldData.pages) return oldData;

      const newPages = oldData.pages.map((page) => {
        const filtered = (page.items || []).filter(
          (item: ConversationResponseDto) => item.id !== conversationId,
        );
        return { ...page, items: filtered };
      });

      return { ...oldData, pages: newPages };
    },
  );

  if (targetItem) {
    const archivedItem: ConversationResponseDto = {
      ...targetItem,
      settings: { ...targetItem.settings, archived: true },
    };
    queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
      archivedKey,
      (oldData) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [
              {
                items: [archivedItem],
                pageInfo: { hasNextPage: false, nextCursor: null },
              },
            ],
            pageParams: [undefined],
          };
        }
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [archivedItem, ...newPages[0].items],
        };
        return { ...oldData, pages: newPages };
      },
    );
  }

  const originalTargetItem = targetItem;

  return {
    previousList,
    previousArchived,
    rollback: (qc, uid) => {
      const targetListKey = [...chatsKeys.list(), uid];
      const targetArchivedKey = [...chatsKeys.archived(), uid];

      // 1. Remove conversation from archived list
      qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
        targetArchivedKey,
        (currArchived) => {
          if (!currArchived || !currArchived.pages) return currArchived;
          return {
            ...currArchived,
            pages: currArchived.pages.map((page) => ({
              ...page,
              items: (page.items || []).filter(
                (item) => item.id !== conversationId,
              ),
            })),
          };
        },
      );

      // 2. Put conversation back into active list if it was found
      if (originalTargetItem) {
        qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
          targetListKey,
          (currList) => {
            if (!currList || !currList.pages) return currList;

            const allItems = currList.pages
              .flatMap((p) => p.items || [])
              .filter((i) => i.id !== conversationId);
            allItems.push({
              ...originalTargetItem,
              settings: { ...originalTargetItem.settings, archived: false },
            });

            sortConversations(allItems);

            return {
              ...currList,
              pages: currList.pages.map((page, index) =>
                index === 0
                  ? { ...page, items: allItems }
                  : { ...page, items: [] },
              ),
            };
          },
        );
      }
    },
  };
};

/**
 * Optimistically unarchives a conversation (removes from archived list, adds back to active list).
 */
export const optimisticallyUnarchive = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
): Promise<OptimisticRollbackContext> => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const archivedKey = [...chatsKeys.archived(), userId];

  const previousList = queryClient.getQueryData(listKey);
  const previousArchived = queryClient.getQueryData(archivedKey);

  const currentArchived =
    queryClient.getQueryData<InfiniteData<ConversationListResponseDto>>(
      archivedKey,
    );
  const targetItem =
    currentArchived?.pages
      ?.flatMap((p) => p.items || [])
      .find((i) => i.id === conversationId) ?? null;

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
    archivedKey,
    (oldData) => {
      if (!oldData || !oldData.pages) return oldData;

      const newPages = oldData.pages.map((page) => {
        const filtered = (page.items || []).filter(
          (item: ConversationResponseDto) => item.id !== conversationId,
        );
        return { ...page, items: filtered };
      });

      return { ...oldData, pages: newPages };
    },
  );

  if (targetItem) {
    const unarchivedItem: ConversationResponseDto = {
      ...targetItem,
      settings: { ...targetItem.settings, archived: false },
    };
    queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(
      listKey,
      (oldData) => {
        if (!oldData || !oldData.pages) return oldData;

        const allItems: ConversationResponseDto[] = oldData.pages.flatMap(
          (p) => p.items || [],
        );
        allItems.push(unarchivedItem);
        sortConversations(allItems);

        const newPages = oldData.pages.map((page, index: number) => {
          if (index === 0) {
            return { ...page, items: allItems };
          }
          return { ...page, items: [] };
        });

        return { ...oldData, pages: newPages };
      },
    );
  }

  const originalTargetItem = targetItem;

  return {
    previousList,
    previousArchived,
    rollback: (qc, uid) => {
      const targetListKey = [...chatsKeys.list(), uid];
      const targetArchivedKey = [...chatsKeys.archived(), uid];

      // 1. Remove from active list
      qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
        targetListKey,
        (currList) => {
          if (!currList || !currList.pages) return currList;
          return {
            ...currList,
            pages: currList.pages.map((page) => ({
              ...page,
              items: (page.items || []).filter(
                (item) => item.id !== conversationId,
              ),
            })),
          };
        },
      );

      // 2. Put back into archived list
      if (originalTargetItem) {
        qc.setQueryData<InfiniteData<ConversationListResponseDto>>(
          targetArchivedKey,
          (currArchived) => {
            if (!currArchived || !currArchived.pages) return currArchived;

            const allItems = currArchived.pages
              .flatMap((p) => p.items || [])
              .filter((i) => i.id !== conversationId);
            allItems.push({
              ...originalTargetItem,
              settings: { ...originalTargetItem.settings, archived: true },
            });

            return {
              ...currArchived,
              pages: currArchived.pages.map((page, index) =>
                index === 0
                  ? { ...page, items: allItems }
                  : { ...page, items: [] },
              ),
            };
          },
        );
      }
    },
  };
};

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
