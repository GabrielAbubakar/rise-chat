import { apiClient } from "@/services/api/client";
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

export const authApi = {
  requestOtp: async (data: RequestOtpDto): Promise<OtpChallengeResponseDto> => {
    const response = await apiClient.post<OtpChallengeResponseDto>(
      "/auth/otp/request",
      data,
    );
    return response.data;
  },

  resendOtp: async (data: ResendOtpDto): Promise<OtpChallengeResponseDto> => {
    const response = await apiClient.post<OtpChallengeResponseDto>(
      "/auth/otp/resend",
      data,
    );
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>(
      "/auth/otp/verify",
      data,
    );
    return response.data;
  },

  refresh: async (data: RefreshTokenDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>(
      "/auth/refresh",
      data,
    );
    return response.data;
  },

  logout: async (data: RefreshTokenDto): Promise<void> => {
    await apiClient.post("/auth/logout", data);
  },

  updateProfile: async (data: UpdateProfileDto): Promise<UserResponseDto> => {
    // Sending POST to /me as requested
    const response = await apiClient.patch<UserResponseDto>("/me", data);
    return response.data;
  },
};
