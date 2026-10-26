import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { ConversationResponseDto, ConversationListResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

/**
 * Optimistically toggles the pinned status of a conversation and re-sorts the list.
 */
export const optimisticallyTogglePin = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
  targetPinned: boolean,
) => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const previousList = queryClient.getQueryData(listKey);

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(listKey, (oldData) => {
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

    updatedItems.sort((a, b) => {
      const aPinned = a.settings?.pinned ? 1 : 0;
      const bPinned = b.settings?.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bTime - aTime;
    });

    const newPages = oldData.pages.map((page: any, index: number) => {
      if (index === 0) {
        return { ...page, items: updatedItems };
      }
      return { ...page, items: [] };
    });

    return { ...oldData, pages: newPages };
  });

  return { previousList };
};

/**
 * Optimistically archives a conversation (removes from active list, adds to archived list).
 */
export const optimisticallyArchive = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
) => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const archivedKey = [...chatsKeys.archived(), userId];

  const previousList = queryClient.getQueryData(listKey);
  const previousArchived = queryClient.getQueryData(archivedKey);

  let archivedItem: ConversationResponseDto | null = null;

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(listKey, (oldData) => {
    if (!oldData || !oldData.pages) return oldData;

    const newPages = oldData.pages.map((page) => {
      const filtered = (page.items || []).filter(
        (item: ConversationResponseDto) => {
          if (item.id === conversationId) {
            archivedItem = {
              ...item,
              settings: { ...item.settings, archived: true },
            };
            return false;
          }
          return true;
        },
      );
      return { ...page, items: filtered };
    });

    return { ...oldData, pages: newPages };
  });

  if (archivedItem) {
    const targetItem: ConversationResponseDto = archivedItem;
    queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(archivedKey, (oldData) => {
      if (!oldData || !oldData.pages) {
        return {
          pages: [
            {
              items: [targetItem],
              pageInfo: { hasNextPage: false, nextCursor: null },
            },
          ],
          pageParams: [undefined],
        };
      }
      const newPages = [...oldData.pages];
      newPages[0] = {
        ...newPages[0],
        items: [targetItem, ...newPages[0].items],
      };
      return { ...oldData, pages: newPages };
    });
  }

  return { previousList, previousArchived };
};

/**
 * Optimistically unarchives a conversation (removes from archived list, adds back to active list).
 */
export const optimisticallyUnarchive = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
) => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const archivedKey = [...chatsKeys.archived(), userId];

  const previousList = queryClient.getQueryData(listKey);
  const previousArchived = queryClient.getQueryData(archivedKey);

  let unarchivedItem: ConversationResponseDto | null = null;

  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(archivedKey, (oldData) => {
    if (!oldData || !oldData.pages) return oldData;

    const newPages = oldData.pages.map((page) => {
      const filtered = (page.items || []).filter(
        (item: ConversationResponseDto) => {
          if (item.id === conversationId) {
            unarchivedItem = {
              ...item,
              settings: { ...item.settings, archived: false },
            };
            return false;
          }
          return true;
        },
      );
      return { ...page, items: filtered };
    });

    return { ...oldData, pages: newPages };
  });

  if (unarchivedItem) {
    const targetItem: ConversationResponseDto = unarchivedItem;
    queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(listKey, (oldData) => {
      if (!oldData || !oldData.pages) return oldData;

      const allItems: ConversationResponseDto[] = oldData.pages.flatMap(
        (p) => p.items || [],
      );
      allItems.push(targetItem);

      allItems.sort((a, b) => {
        const aPinned = a.settings?.pinned ? 1 : 0;
        const bPinned = b.settings?.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aTime = a.lastActivityAt
          ? new Date(a.lastActivityAt).getTime()
          : 0;
        const bTime = b.lastActivityAt
          ? new Date(b.lastActivityAt).getTime()
          : 0;
        return bTime - aTime;
      });

      const newPages = oldData.pages.map((page, index: number) => {
        if (index === 0) {
          return { ...page, items: allItems };
        }
        return { ...page, items: [] };
      });

      return { ...oldData, pages: newPages };
    });
  }

  return { previousList, previousArchived };
};

/**
 * Optimistically toggles the muted status of a conversation.
 */
export const optimisticallyToggleMute = async (
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
  targetMuted: boolean,
) => {
  await queryClient.cancelQueries({ queryKey: chatsKeys.conversations() });

  const listKey = [...chatsKeys.list(), userId];
  const previousList = queryClient.getQueryData(listKey);

  const detailKey = [...chatsKeys.detail(conversationId), userId];
  const previousDetail = queryClient.getQueryData(detailKey);

  // 1. Optimistically update conversations list
  queryClient.setQueryData<InfiniteData<ConversationListResponseDto>>(listKey, (oldData) => {
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
  });

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

  return { previousList, previousDetail, detailKey };
};
