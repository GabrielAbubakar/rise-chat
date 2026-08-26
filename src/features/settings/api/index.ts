import { apiClient } from '@/services/api/client';
import { ProfileResponseDto, UpdateProfileDto } from '../types';

export const profileApi = {
  getMe: async (): Promise<ProfileResponseDto> => {
    const response = await apiClient.get<ProfileResponseDto>('/me');
    return response.data;
  },

  updateMe: async (data: UpdateProfileDto): Promise<ProfileResponseDto> => {
    const response = await apiClient.patch<ProfileResponseDto>('/me', data);
    return response.data;
  },
};
