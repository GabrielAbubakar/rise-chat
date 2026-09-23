export type MediaPurpose = "profile_avatar" | "group_avatar" | "message_attachment";

export type MediaContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "audio/aac"
  | "audio/mp4"
  | "audio/m4a"
  | "audio/x-m4a"
  | "audio/mpeg"
  | "audio/ogg"
  | "audio/wav"
  | "audio/x-wav"
  | "video/mp4"
  | "video/quicktime"
  | "video/webm"
  | "application/pdf"
  | "text/plain"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export interface CreateMediaUploadDto {
  clientUploadId: string;
  purpose: MediaPurpose;
  contentType: MediaContentType;
  sizeBytes: number;
  contentSha256?: string;
  originalFilename?: string;
}

export interface CloudinaryUploadFieldsDto {
  api_key: string;
  timestamp: string;
  signature: string;
  public_id: string;
  context: string;
  type: string;
  overwrite: string;
  allowed_formats: string;
  upload_preset: string;
  transformation?: string;
}

export interface CloudinaryUploadAuthorizationDto {
  url: string;
  method: "POST";
  expiresAt: string;
  fields: CloudinaryUploadFieldsDto;
}

export interface MediaAssetResponseDto {
  id: string;
  purpose: MediaPurpose;
  status: "pending" | "ready" | "failed" | "deleted";
  type: "image" | "audio";
  contentType: MediaContentType;
  sizeBytes: number;
  originalFilename: string | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  secureUrl: string | null;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
}

export interface CreateMediaUploadResponseDto {
  media: MediaAssetResponseDto;
  upload: CloudinaryUploadAuthorizationDto | null;
}
