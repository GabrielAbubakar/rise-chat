import { useAuthStore } from "@/store/useAuthStore";
import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import { ConversationResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

export const useConversationsList = (params?: { limit?: number }) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.list(), user?.id],
    queryFn: ({ pageParam }) => chatsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!user?.id,
  });
};

export const useConversationDetail = (
  conversationId: string,
  options?: Partial<UseQueryOptions<ConversationResponseDto, Error>>,
) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: [...chatsKeys.detail(conversationId), user?.id],
    queryFn: () => chatsApi.get(conversationId),
    enabled: !!conversationId && !!user?.id && (options?.enabled ?? true),
    ...options,
  });
};

export const useConversationMessages = (
  conversationId: string,
  params?: { limit?: number },
) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.messages(conversationId), user?.id],
    queryFn: ({ pageParam }) =>
      chatsApi.listMessages(conversationId, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!conversationId && !!user?.id,
  });
};

export const useArchivedConversationsList = (params?: { limit?: number }) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.archived(), user?.id],
    queryFn: ({ pageParam }) =>
      chatsApi.listArchived({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!user?.id,
  });
};

export const useFavoritesList = (params?: { limit?: number }) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.favorites(), user?.id],
    queryFn: ({ pageParam }) =>
      chatsApi.listFavorites({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!user?.id,
  });
};
