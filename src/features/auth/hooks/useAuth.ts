import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api';
import {
  RequestOtpDto,
  ResendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  OtpChallengeResponseDto,
  AuthResponseDto,
} from '../types';

export const useRequestOtp = (
  options?: UseMutationOptions<OtpChallengeResponseDto, Error, RequestOtpDto>
) => {
  return useMutation({
    mutationFn: authApi.requestOtp,
    ...options,
  });
};

export const useResendOtp = (
  options?: UseMutationOptions<OtpChallengeResponseDto, Error, ResendOtpDto>
) => {
  return useMutation({
    mutationFn: authApi.resendOtp,
    ...options,
  });
};

export const useVerifyOtp = (
  options?: UseMutationOptions<AuthResponseDto, Error, VerifyOtpDto>
) => {
  return useMutation({
    mutationFn: authApi.verifyOtp,
    ...options,
  });
};

export const useRefresh = (
  options?: UseMutationOptions<AuthResponseDto, Error, RefreshTokenDto>
) => {
  return useMutation({
    mutationFn: authApi.refresh,
    ...options,
  });
};

export const useLogout = (
  options?: UseMutationOptions<void, Error, RefreshTokenDto>
) => {
  return useMutation({
    mutationFn: authApi.logout,
    ...options,
  });
};
