import { useQuery, useMutation, useInfiniteQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { chatsApi } from '../api';
import {
  MatchContactsDto,
  ContactMatchesResponseDto,
  UserSearchResponseDto,
  CreateDirectConversationDto,
  ConversationResponseDto,
  SendMessageDto,
  MessageResponseDto,
  UpdateReceiptDto,
} from '../types';

export const chatsKeys = {
  all: ['chats'] as const,
  discovery: () => [...chatsKeys.all, 'discovery'] as const,
  search: (q: string) => [...chatsKeys.discovery(), 'search', q] as const,
  conversations: () => [...chatsKeys.all, 'conversations'] as const,
  list: () => [...chatsKeys.conversations(), 'list'] as const,
  detail: (id: string) => [...chatsKeys.conversations(), 'detail', id] as const,
  messages: (id: string) => [...chatsKeys.conversations(), 'messages', id] as const,
};

// Discovery Hooks
export const useMatchContacts = (
  options?: UseMutationOptions<ContactMatchesResponseDto, Error, MatchContactsDto>
) => {
  return useMutation({
    mutationFn: chatsApi.matchContacts,
    ...options,
  });
};

export const useSearchUsers = (
  params: { q: string; limit?: number; cursor?: string },
  options?: Partial<UseQueryOptions<UserSearchResponseDto, Error>>
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
  options?: UseMutationOptions<ConversationResponseDto, Error, CreateDirectConversationDto>
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
  return useInfiniteQuery({
    queryKey: chatsKeys.list(),
    queryFn: ({ pageParam }) => chatsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
  });
};

export const useConversationDetail = (
  conversationId: string,
  options?: Partial<UseQueryOptions<ConversationResponseDto, Error>>
) => {
  return useQuery({
    queryKey: chatsKeys.detail(conversationId),
    queryFn: () => chatsApi.get(conversationId),
    enabled: !!conversationId && (options?.enabled ?? true),
    ...options,
  });
};

export const useConversationMessages = (conversationId: string, params?: { limit?: number }) => {
  return useInfiniteQuery({
    queryKey: chatsKeys.messages(conversationId),
    queryFn: ({ pageParam }) => chatsApi.listMessages(conversationId, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
    enabled: !!conversationId,
  });
};

export const useSendMessage = (
  conversationId: string,
  options?: UseMutationOptions<MessageResponseDto, Error, SendMessageDto>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageDto) => chatsApi.sendMessage(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
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
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
  });
};

export const useMarkReceiptDelivered = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) => chatsApi.markReceiptDelivered(conversationId, data),
  });
};

export const useMarkReceiptRead = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) => chatsApi.markReceiptRead(conversationId, data),
  });
};
