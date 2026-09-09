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
  CreateGroupConversationDto,
  GroupConversationResponseDto,
  UpdateGroupConversationDto,
  AddGroupMembersDto,
  UpdateGroupMemberRoleDto,
  TransferGroupOwnershipDto,
  UpdateConversationSettingsDto,
  ConversationSettingsResponseDto,
  MuteConversationDto,
  ClearConversationMessagesResponseDto,
} from "../types";

export const chatsKeys = {
  all: ["chats"] as const,
  discovery: () => [...chatsKeys.all, "discovery"] as const,
  search: (q: string) => [...chatsKeys.discovery(), "search", q] as const,
  conversations: () => [...chatsKeys.all, "conversations"] as const,
  list: () => [...chatsKeys.conversations(), "list"] as const,
  archived: () => [...chatsKeys.conversations(), "archived"] as const,
  favorites: () => [...chatsKeys.conversations(), "favorites"] as const,
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

// Group Chat Hooks
export const useCreateGroup = (options?: UseMutationOptions<GroupConversationResponseDto, Error, CreateGroupConversationDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatsApi.createGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUpdateGroup = (conversationId: string, options?: UseMutationOptions<GroupConversationResponseDto, Error, UpdateGroupConversationDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.updateGroup(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useDeleteGroup = (conversationId: string, options?: UseMutationOptions<void, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.deleteGroup(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useAddGroupMembers = (conversationId: string, options?: UseMutationOptions<GroupConversationResponseDto, Error, AddGroupMembersDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.addGroupMembers(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useRemoveGroupMember = (conversationId: string, options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId) => chatsApi.removeGroupMember(conversationId, memberId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUpdateGroupMemberRole = (conversationId: string, options?: UseMutationOptions<GroupConversationResponseDto, Error, { memberId: string; data: UpdateGroupMemberRoleDto }>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }) => chatsApi.updateGroupMemberRole(conversationId, memberId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useTransferGroupOwnership = (conversationId: string, options?: UseMutationOptions<GroupConversationResponseDto, Error, TransferGroupOwnershipDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.transferGroupOwnership(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useLeaveGroup = (conversationId: string, options?: UseMutationOptions<void, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.leaveGroup(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

// Conversation Settings & Status Hooks
export const useUpdateConversationSettings = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, UpdateConversationSettingsDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.updateConversationSettings(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useArchiveConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.archiveConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatsKeys.archived() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUnarchiveConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.unarchiveConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatsKeys.archived() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useMuteConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, MuteConversationDto>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.muteConversation(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUnmuteConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.unmuteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useFavoriteConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.favoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUnfavoriteConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.unfavoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useClearMessages = (conversationId: string, options?: UseMutationOptions<ClearConversationMessagesResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.clearMessages(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.messages(conversationId) });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useArchivedConversationsList = (params?: { limit?: number }) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.archived(), user?.id],
    queryFn: ({ pageParam }) => chatsApi.listArchived({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!user?.id,
  });
};

export const useFavoritesList = (params?: { limit?: number }) => {
  const user = useAuthStore((state) => state.user);
  return useInfiniteQuery({
    queryKey: [...chatsKeys.favorites(), user?.id],
    queryFn: ({ pageParam }) => chatsApi.listFavorites({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!user?.id,
  });
};

export const usePinConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.pinConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUnpinConversation = (conversationId: string, options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.unpinConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};
