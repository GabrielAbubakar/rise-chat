import { useAuthStore } from "@/store/useAuthStore";
import {
  useInfiniteQuery,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  ContactMatchesResponseDto,
  ConversationResponseDto,
  CreateDirectConversationDto,
  MatchContactsDto,
  MessageResponseDto,
  SendMessageDto,
  UpdateReceiptDto,
  UserSearchResponseDto,
} from "../types";

export const chatsKeys = {
  all: ["chats"] as const,
  discovery: () => [...chatsKeys.all, "discovery"] as const,
  search: (q: string) => [...chatsKeys.discovery(), "search", q] as const,
  conversations: () => [...chatsKeys.all, "conversations"] as const,
  list: () => [...chatsKeys.conversations(), "list"] as const,
  detail: (id: string) => [...chatsKeys.conversations(), "detail", id] as const,
  messages: (id: string) =>
    [...chatsKeys.conversations(), "messages", id] as const,
};

// Discovery Hooks
export const useMatchContacts = (
  options?: UseMutationOptions<
    ContactMatchesResponseDto,
    Error,
    MatchContactsDto
  >,
) => {
  return useMutation({
    mutationFn: chatsApi.matchContacts,
    ...options,
  });
};

export const useSearchUsers = (
  params: { q: string; limit?: number; cursor?: string },
  options?: Partial<UseQueryOptions<UserSearchResponseDto, Error>>,
) => {
  return useQuery({
    queryKey: chatsKeys.search(params.q),
    queryFn: () => chatsApi.searchUsers(params),
    enabled: params.q.length >= 3 && (options?.enabled ?? true),
    ...options,
  });
};

// Conversation Hooks
export const useCreateDirectConversation = (
  options?: UseMutationOptions<
    ConversationResponseDto,
    Error,
    CreateDirectConversationDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatsApi.createDirect,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

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

export const useSendMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    SendMessageDto,
    { previousData: unknown }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageDto) =>
      chatsApi.sendMessage(conversationId, data),
    onMutate: async (newMessageDto) => {
      const currentUser = useAuthStore.getState().user;
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];

      await queryClient.cancelQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      const previousData = queryClient.getQueryData(msgKey);

      const optimisticMsg: MessageResponseDto = {
        id: `temp_${Date.now()}`,
        conversationId,
        clientMessageId: newMessageDto.clientMessageId,
        senderId: currentUser?.id || "",
        kind: "text",
        text: newMessageDto.text,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(msgKey, (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [optimisticMsg],
                pageInfo: { hasNextPage: false, nextCursor: null },
              },
            ],
            pageParams: [undefined],
          };
        }
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [optimisticMsg, ...newPages[0].items],
        };
        return { ...oldData, pages: newPages };
      });

      return { previousData };
    },
    onSuccess: (realMsg, variables, context) => {
      console.log("✅ [SendMessage] Success:", realMsg);
      const currentUser = useAuthStore.getState().user;
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];
      queryClient.setQueryData(msgKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) =>
            item.clientMessageId === variables.clientMessageId ||
            item.id === realMsg.id
              ? realMsg
              : item,
          ),
        }));
        return { ...oldData, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
    onError: (err, newMsg, context: any) => {
      console.error("❌ [SendMessage] Error:", err);
      if (context?.previousData) {
        const currentUser = useAuthStore.getState().user;
        queryClient.setQueryData(
          [...chatsKeys.messages(conversationId), currentUser?.id],
          context.previousData,
        );
      }
    },
    ...options,
  });
};

export const useMarkRead = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
  });
};

export const useMarkReceiptDelivered = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) =>
      chatsApi.markReceiptDelivered(conversationId, data),
  });
};

export const useMarkReceiptRead = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) =>
      chatsApi.markReceiptRead(conversationId, data),
  });
};
