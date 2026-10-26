import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { authApi } from "../api";
import {
  AuthResponseDto,
  OtpChallengeResponseDto,
  RefreshTokenDto,
  RequestOtpDto,
  ResendOtpDto,
  UpdateProfileDto,
  UserResponseDto,
  VerifyOtpDto,
} from "../types";

export const useRequestOtp = (
  options?: UseMutationOptions<OtpChallengeResponseDto, Error, RequestOtpDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.requestOtp,
  });
};

export const useResendOtp = (
  options?: UseMutationOptions<OtpChallengeResponseDto, Error, ResendOtpDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.resendOtp,
  });
};

export const useVerifyOtp = (
  options?: UseMutationOptions<AuthResponseDto, Error, VerifyOtpDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.verifyOtp,
  });
};

export const useRefresh = (
  options?: UseMutationOptions<AuthResponseDto, Error, RefreshTokenDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.refresh,
  });
};

export const useLogout = (
  options?: UseMutationOptions<void, Error, RefreshTokenDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.logout,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<UserResponseDto, Error, UpdateProfileDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.updateProfile,
    onSuccess: async (...args) => {
      const { queryClient } = await import('@/core/queryClient');
      const { profileKeys } = await import('@/features/settings/hooks/useProfile');
      queryClient.setQueryData(profileKeys.me(), args[0]);

      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
  });
};
