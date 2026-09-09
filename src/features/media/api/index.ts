import { apiClient } from "@/services/api/client";
import { CreateMediaUploadDto, CreateMediaUploadResponseDto, MediaAssetResponseDto } from "../types";

export const mediaApi = {
  createUpload: async (data: CreateMediaUploadDto): Promise<CreateMediaUploadResponseDto> => {
    const response = await apiClient.post<CreateMediaUploadResponseDto>('/media/uploads', data);
    return response.data;
  },

  completeUpload: async (mediaId: string): Promise<MediaAssetResponseDto> => {
    const response = await apiClient.post<MediaAssetResponseDto>(`/media/uploads/${mediaId}/complete`);
    return response.data;
  },
};
