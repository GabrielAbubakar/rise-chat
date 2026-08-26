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
    mutationFn: authApi.requestOtp,
    ...options,
  });
};

export const useResendOtp = (
  options?: UseMutationOptions<OtpChallengeResponseDto, Error, ResendOtpDto>,
) => {
  return useMutation({
    mutationFn: authApi.resendOtp,
    ...options,
  });
};

export const useVerifyOtp = (
  options?: UseMutationOptions<AuthResponseDto, Error, VerifyOtpDto>,
) => {
  return useMutation({
    mutationFn: authApi.verifyOtp,
    ...options,
  });
};

export const useRefresh = (
  options?: UseMutationOptions<AuthResponseDto, Error, RefreshTokenDto>,
) => {
  return useMutation({
    mutationFn: authApi.refresh,
    ...options,
  });
};

export const useLogout = (
  options?: UseMutationOptions<void, Error, RefreshTokenDto>,
) => {
  return useMutation({
    mutationFn: authApi.logout,
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<UserResponseDto, Error, UpdateProfileDto>,
) => {
  return useMutation({
    ...options,
    mutationFn: authApi.updateProfile,
    onSuccess: async (...args) => {
      const { useAuthStore } = await import('@/store/useAuthStore');
      useAuthStore.getState().setUser(args[0]);

      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
  });
};
