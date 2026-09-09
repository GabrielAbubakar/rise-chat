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

  // Group Conversations
  createGroup: async (data: CreateGroupConversationDto): Promise<GroupConversationResponseDto> => {
    const response = await apiClient.post<GroupConversationResponseDto>('/conversations/group', data);
    return response.data;
  },

  updateGroup: async (conversationId: string, data: UpdateGroupConversationDto): Promise<GroupConversationResponseDto> => {
    const response = await apiClient.patch<GroupConversationResponseDto>(`/conversations/${conversationId}`, data);
    return response.data;
  },

  deleteGroup: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  addGroupMembers: async (conversationId: string, data: AddGroupMembersDto): Promise<GroupConversationResponseDto> => {
    const response = await apiClient.post<GroupConversationResponseDto>(`/conversations/${conversationId}/members`, data);
    return response.data;
  },

  removeGroupMember: async (conversationId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}/members/${memberId}`);
  },

  updateGroupMemberRole: async (conversationId: string, memberId: string, data: UpdateGroupMemberRoleDto): Promise<GroupConversationResponseDto> => {
    const response = await apiClient.patch<GroupConversationResponseDto>(`/conversations/${conversationId}/members/${memberId}/role`, data);
    return response.data;
  },

  transferGroupOwnership: async (conversationId: string, data: TransferGroupOwnershipDto): Promise<GroupConversationResponseDto> => {
    const response = await apiClient.post<GroupConversationResponseDto>(`/conversations/${conversationId}/transfer-ownership`, data);
    return response.data;
  },

  leaveGroup: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/conversations/${conversationId}/leave`);
  },

  // Conversation Settings
  updateConversationSettings: async (conversationId: string, data: UpdateConversationSettingsDto): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.patch<ConversationSettingsResponseDto>(`/conversations/${conversationId}/settings`, data);
    return response.data;
  },

  archiveConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.put<ConversationSettingsResponseDto>(`/conversations/${conversationId}/archive`);
    return response.data;
  },

  unarchiveConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(`/conversations/${conversationId}/archive`);
    return response.data;
  },

  listArchived: async (params?: { limit?: number; cursor?: string }): Promise<ConversationListResponseDto> => {
    const response = await apiClient.get<ConversationListResponseDto>('/conversations/archived', { params });
    return response.data;
  },

  muteConversation: async (conversationId: string, data: MuteConversationDto): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.put<ConversationSettingsResponseDto>(`/conversations/${conversationId}/mute`, data);
    return response.data;
  },

  unmuteConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(`/conversations/${conversationId}/mute`);
    return response.data;
  },

  favoriteConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.put<ConversationSettingsResponseDto>(`/conversations/${conversationId}/favorite`);
    return response.data;
  },

  unfavoriteConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(`/conversations/${conversationId}/favorite`);
    return response.data;
  },

  clearMessages: async (conversationId: string): Promise<ClearConversationMessagesResponseDto> => {
    const response = await apiClient.delete<ClearConversationMessagesResponseDto>(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  listFavorites: async (params?: { limit?: number; cursor?: string }): Promise<ConversationListResponseDto> => {
    const response = await apiClient.get<ConversationListResponseDto>('/conversations/favorites', { params });
    return response.data;
  },

  pinConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.put<ConversationSettingsResponseDto>(`/conversations/${conversationId}/pin`);
    return response.data;
  },

  unpinConversation: async (conversationId: string): Promise<ConversationSettingsResponseDto> => {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(`/conversations/${conversationId}/pin`);
    return response.data;
  },
};
