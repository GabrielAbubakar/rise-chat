import { apiClient } from '@/services/api/client';
import {
  MatchContactsDto,
  ContactMatchesResponseDto,
  UserSearchResponseDto,
  CreateDirectConversationDto,
  ConversationResponseDto,
  ConversationListResponseDto,
  SendMessageDto,
  MessageResponseDto,
  MessageHistoryResponseDto,
  ConversationReadStateResponseDto,
  UpdateReceiptDto,
  ReceiptUpdateResponseDto,
  ReceiptFrontiersResponseDto,
} from '../types';

export const chatsApi = {
  // Discovery
  matchContacts: async (data: MatchContactsDto): Promise<ContactMatchesResponseDto> => {
    const response = await apiClient.post<ContactMatchesResponseDto>('/contacts/match', data);
    return response.data;
  },

  searchUsers: async (params: { q: string; limit?: number; cursor?: string }): Promise<UserSearchResponseDto> => {
    const response = await apiClient.get<UserSearchResponseDto>('/users/search', { params });
    return response.data;
  },

  // Conversations
  createDirect: async (data: CreateDirectConversationDto): Promise<ConversationResponseDto> => {
    const response = await apiClient.post<ConversationResponseDto>('/conversations/direct', data);
    return response.data;
  },

  list: async (params?: { limit?: number; cursor?: string }): Promise<ConversationListResponseDto> => {
    const response = await apiClient.get<ConversationListResponseDto>('/conversations', { params });
    return response.data;
  },

  get: async (conversationId: string): Promise<ConversationResponseDto> => {
    const response = await apiClient.get<ConversationResponseDto>(`/conversations/${conversationId}`);
    return response.data;
  },

  sendMessage: async (conversationId: string, data: SendMessageDto): Promise<MessageResponseDto> => {
    const response = await apiClient.post<MessageResponseDto>(`/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  listMessages: async (
    conversationId: string,
    params?: { limit?: number; cursor?: string }
  ): Promise<MessageHistoryResponseDto> => {
    const response = await apiClient.get<MessageHistoryResponseDto>(`/conversations/${conversationId}/messages`, {
      params,
    });
    return response.data;
  },

  markRead: async (conversationId: string): Promise<ConversationReadStateResponseDto> => {
    const response = await apiClient.post<ConversationReadStateResponseDto>(`/conversations/${conversationId}/read`);
    return response.data;
  },

  markReceiptDelivered: async (
    conversationId: string,
    data: UpdateReceiptDto
  ): Promise<ReceiptUpdateResponseDto> => {
    const response = await apiClient.put<ReceiptUpdateResponseDto>(
      `/conversations/${conversationId}/receipts/delivered`,
      data
    );
    return response.data;
  },

  markReceiptRead: async (
    conversationId: string,
    data: UpdateReceiptDto
  ): Promise<ReceiptUpdateResponseDto> => {
    const response = await apiClient.put<ReceiptUpdateResponseDto>(
      `/conversations/${conversationId}/receipts/read`,
      data
    );
    return response.data;
  },

  listReceipts: async (conversationId: string): Promise<ReceiptFrontiersResponseDto> => {
    const response = await apiClient.get<ReceiptFrontiersResponseDto>(
      `/conversations/${conversationId}/receipts`
    );
    return response.data;
  },
};
