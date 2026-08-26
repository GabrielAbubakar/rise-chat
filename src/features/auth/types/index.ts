export interface RequestOtpDto {
  phoneNumber: string;
}

export interface ResendOtpDto {
  challengeId: string;
}

export interface AuthDeviceDto {
  name?: string;
  platform?: 'ios' | 'android' | 'web' | 'unknown';
}

export interface VerifyOtpDto {
  challengeId: string;
  code: string;
  device?: AuthDeviceDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface OtpChallengeResponseDto {
  challengeId: string;
  phoneNumberMasked: string;
  expiresInSeconds: number;
  resendInSeconds: number;
  codeLength: number;
}

export interface UserResponseDto {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: UserResponseDto;
}

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}
