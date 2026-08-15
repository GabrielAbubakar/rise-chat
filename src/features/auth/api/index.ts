import { apiClient } from '@/services/api/client';
import {
  RequestOtpDto,
  ResendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  OtpChallengeResponseDto,
  AuthResponseDto,
} from '../types';

export const authApi = {
  requestOtp: async (data: RequestOtpDto): Promise<OtpChallengeResponseDto> => {
    const response = await apiClient.post<OtpChallengeResponseDto>('/auth/otp/request', data);
    return response.data;
  },

  resendOtp: async (data: ResendOtpDto): Promise<OtpChallengeResponseDto> => {
    const response = await apiClient.post<OtpChallengeResponseDto>('/auth/otp/resend', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>('/auth/otp/verify', data);
    return response.data;
  },

  refresh: async (data: RefreshTokenDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>('/auth/refresh', data);
    return response.data;
  },

  logout: async (data: RefreshTokenDto): Promise<void> => {
    await apiClient.post('/auth/logout', data);
  },
};
