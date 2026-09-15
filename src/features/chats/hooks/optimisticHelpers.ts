import { QueryClient } from "@tanstack/react-query";
import { ConversationResponseDto } from "../types";
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

  queryClient.setQueryData(listKey, (oldData: any) => {
    if (!oldData || !oldData.pages) return oldData;

    const allItems: ConversationResponseDto[] = oldData.pages.flatMap(
      (p: any) => p.items || [],
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
      const aTime = a.lastActivityAt
        ? new Date(a.lastActivityAt).getTime()
        : 0;
      const bTime = b.lastActivityAt
        ? new Date(b.lastActivityAt).getTime()
        : 0;
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

  queryClient.setQueryData(listKey, (oldData: any) => {
    if (!oldData || !oldData.pages) return oldData;

    const newPages = oldData.pages.map((page: any) => {
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
    queryClient.setQueryData(archivedKey, (oldData: any) => {
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

  queryClient.setQueryData(archivedKey, (oldData: any) => {
    if (!oldData || !oldData.pages) return oldData;

    const newPages = oldData.pages.map((page: any) => {
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
    queryClient.setQueryData(listKey, (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;

      const allItems: ConversationResponseDto[] = oldData.pages.flatMap(
        (p: any) => p.items || [],
      );
      allItems.push(unarchivedItem!);

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

      const newPages = oldData.pages.map((page: any, index: number) => {
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

  queryClient.setQueryData(listKey, (oldData: any) => {
    if (!oldData || !oldData.pages) return oldData;

    const newPages = oldData.pages.map((page: any) => ({
      ...page,
      items: (page.items || []).map((item: ConversationResponseDto) => {
        if (item.id === conversationId) {
          return {
            ...item,
            settings: {
              ...item.settings,
              muted: targetMuted,
            },
          };
        }
        return item;
      }),
    }));

    return { ...oldData, pages: newPages };
  });

  return { previousList };
};
