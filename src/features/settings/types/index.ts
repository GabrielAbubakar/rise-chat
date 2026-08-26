export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string | null;
}

// UserResponseDto is already in auth, but if they are completely separated by feature, 
// we might want a ProfileResponseDto. We can just export it here for settings specifically.
export interface ProfileResponseDto {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  createdAt: string;
}
