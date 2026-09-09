import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { profileApi } from '../api';
import { ProfileResponseDto, UpdateProfileDto, BlockResponseDto, BlockListResponseDto, SetProfileAvatarDto } from '../types';

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  blocks: () => [...profileKeys.all, 'blocks'] as const,
};

export const useGetMe = (
  options?: Partial<UseQueryOptions<ProfileResponseDto, Error>>
) => {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: profileApi.getMe,
    ...options,
  });
};

export const useUpdateMe = (
  options?: UseMutationOptions<ProfileResponseDto, Error, UpdateProfileDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: (...args) => {
      queryClient.setQueryData(profileKeys.me(), args[0]);
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

export const useBlocksList = (options?: Partial<UseQueryOptions<BlockListResponseDto, Error>>) => {
  return useQuery({
    queryKey: profileKeys.blocks(),
    queryFn: profileApi.listBlocks,
    ...options,
  });
};

export const useBlockUser = (options?: UseMutationOptions<BlockResponseDto, Error, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.blockUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.blocks() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

export const useUnblockUser = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unblockUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.blocks() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

export const useSetAvatar = (
  options?: UseMutationOptions<ProfileResponseDto, Error, SetProfileAvatarDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.setAvatar,
    onSuccess: (...args) => {
      queryClient.setQueryData(profileKeys.me(), args[0]);
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

export const useRemoveAvatar = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.removeAvatar,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};
