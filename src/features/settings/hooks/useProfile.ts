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
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(profileKeys.me(), data);
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      if (options?.onSuccess) {
        (options.onSuccess as Function)(data, variables, context);
      }
    },
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
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.blocks() });
      if (options?.onSuccess) {
        (options.onSuccess as Function)(data, variables, context);
      }
    },
  });
};

export const useUnblockUser = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unblockUser,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.blocks() });
      if (options?.onSuccess) {
        (options.onSuccess as Function)(data, variables, context);
      }
    },
  });
};

export const useSetAvatar = (
  options?: UseMutationOptions<ProfileResponseDto, Error, SetProfileAvatarDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.setAvatar,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(profileKeys.me(), data);
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      if (options?.onSuccess) {
        (options.onSuccess as Function)(data, variables, context);
      }
    },
  });
};

export const useRemoveAvatar = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.removeAvatar,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      if (options?.onSuccess) {
        (options.onSuccess as Function)(data, variables, context);
      }
    },
  });
};
