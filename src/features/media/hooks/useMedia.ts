import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { mediaApi } from "../api";
import { CreateMediaUploadDto, CreateMediaUploadResponseDto, MediaAssetResponseDto } from "../types";

export const mediaKeys = {
  all: ["media"] as const,
};

export const useCreateMediaUpload = (
  options?: UseMutationOptions<CreateMediaUploadResponseDto, Error, CreateMediaUploadDto>
) => {
  return useMutation({
    ...options,
    mutationFn: mediaApi.createUpload,
  });
};

export const useCompleteMediaUpload = (
  options?: UseMutationOptions<MediaAssetResponseDto, Error, string>
) => {
  return useMutation({
    ...options,
    mutationFn: mediaApi.completeUpload,
  });
};
