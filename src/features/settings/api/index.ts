import { apiClient } from '@/services/api/client';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  BlockResponseDto,
  BlockListResponseDto,
} from '../types';

export const profileApi = {
  getMe: async (): Promise<ProfileResponseDto> => {
    const response = await apiClient.get<ProfileResponseDto>('/me');
    return response.data;
  },

  setAvatar: async (data: { mediaId: string }): Promise<ProfileResponseDto> => {
    const response = await apiClient.put<ProfileResponseDto>('/me/avatar', data);
    return response.data;
  },

  removeAvatar: async (): Promise<void> => {
    await apiClient.delete('/me/avatar');
  },

  updateMe: async (data: UpdateProfileDto): Promise<ProfileResponseDto> => {
    const response = await apiClient.patch<ProfileResponseDto>('/me', data);
    return response.data;
  },

  listBlocks: async (): Promise<BlockListResponseDto> => {
    const response = await apiClient.get<BlockListResponseDto>('/me/blocks');
    return response.data;
  },

  blockUser: async (userId: string): Promise<BlockResponseDto> => {
    const response = await apiClient.put<BlockResponseDto>(`/me/blocks/${userId}`);
    return response.data;
  },

  unblockUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/me/blocks/${userId}`);
  },
};
