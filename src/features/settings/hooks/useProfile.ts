import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { profileApi } from '../api';
import { ProfileResponseDto, UpdateProfileDto } from '../types';

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
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
