import axios from "axios";
import { generateUUID } from "@/shared/utils";
import { mediaApi } from "../api";
import {
  MediaAssetResponseDto,
  MediaContentType,
  MediaPurpose,
} from "../types";

export interface UploadMediaParams {
  uri: string;
  purpose: MediaPurpose;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  clientUploadId?: string;
  signal?: AbortSignal;
}

export const MAX_MEDIA_SIZE_BYTES = 52428800; // 50 MiB

export const VALID_MEDIA_CONTENT_TYPES: MediaContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/aac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function resolveContentTypeAndFilename(
  uri: string,
  providedMimeType?: string,
  providedFileName?: string,
): { mimeType: MediaContentType; fileName: string } {
  let extension = "jpg";
  const target = (providedFileName || uri).toLowerCase();

  if (target.endsWith(".png")) extension = "png";
  else if (target.endsWith(".webp")) extension = "webp";
  else if (target.endsWith(".mp4")) extension = "mp4";
  else if (target.endsWith(".m4a") || target.endsWith(".aac")) extension = "m4a";
  else if (target.endsWith(".pdf")) extension = "pdf";
  else if (target.endsWith(".docx")) extension = "docx";
  else if (target.endsWith(".xlsx")) extension = "xlsx";
  else if (target.endsWith(".txt")) extension = "txt";

  let normalizedMime = providedMimeType;
  if (normalizedMime === "image/jpg") normalizedMime = "image/jpeg";
  if (normalizedMime === "audio/mp3") normalizedMime = "audio/mpeg";

  let mimeType: MediaContentType = "image/jpeg";
  if (
    normalizedMime &&
    VALID_MEDIA_CONTENT_TYPES.includes(normalizedMime as MediaContentType)
  ) {
    mimeType = normalizedMime as MediaContentType;
  } else if (extension === "png") {
    mimeType = "image/png";
  } else if (extension === "webp") {
    mimeType = "image/webp";
  } else if (extension === "mp4") {
    mimeType = "video/mp4";
  } else if (extension === "m4a") {
    mimeType = "audio/m4a";
  } else if (extension === "pdf") {
    mimeType = "application/pdf";
  } else if (extension === "docx") {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (extension === "xlsx") {
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (extension === "txt") {
    mimeType = "text/plain";
  }

  const fileName = providedFileName || `upload_${Date.now()}.${extension}`;
  return { mimeType, fileName };
}

/**
 * Reusable media upload service:
 * 1. Validates file size and MIME type against supported boundaries
 * 2. Requests upload credentials from backend (POST /v1/media/uploads)
 * 3. Handles already-ready (deduplicated) media without re-uploading
 * 4. Uploads file multipart payload directly to Cloudinary storage with AbortSignal cancellation
 * 5. Completes upload verification with backend and returns confirmed MediaAssetResponseDto
 */
export async function uploadMedia(
  params: UploadMediaParams,
): Promise<MediaAssetResponseDto> {
  if (params.signal?.aborted) {
    throw new Error("Upload was cancelled");
  }

  const { mimeType, fileName } = resolveContentTypeAndFilename(
    params.uri,
    params.mimeType,
    params.fileName,
  );

  // Validate allowed content type
  if (!VALID_MEDIA_CONTENT_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported media type: ${mimeType}`);
  }

  // Validate file size bounds (must not exceed 50 MiB)
  if (params.sizeBytes && params.sizeBytes > MAX_MEDIA_SIZE_BYTES) {
    throw new Error("File size exceeds 50 MB limit");
  }

  // Use actual size if available, fallback to minimum 1024 bytes (never guess arbitrary 500 KB)
  const sizeBytes = params.sizeBytes && params.sizeBytes > 0
    ? Math.min(params.sizeBytes, MAX_MEDIA_SIZE_BYTES)
    : 1024;

  const clientUploadId = params.clientUploadId || generateUUID();

  // Step 1: Create upload authorization
  const uploadAuth = await mediaApi.createUpload({
    clientUploadId,
    purpose: params.purpose,
    contentType: mimeType,
    sizeBytes,
    originalFilename: fileName,
  });

  if (params.signal?.aborted) {
    throw new Error("Upload was cancelled");
  }

  // Step 2: Upload directly to storage if required
  if (uploadAuth.upload) {
    const formData = new FormData();
    if (uploadAuth.upload.fields) {
      Object.entries(uploadAuth.upload.fields).forEach(([key, val]) => {
        formData.append(key, String(val));
      });
    }

    formData.append("file", {
      uri: params.uri,
      name: fileName,
      type: mimeType,
    } as any);

    // Step 2: Upload directly to storage if required
    // Standalone Axios uses React Native's native XMLHttpRequest network layer, which streams
    // the local file directly from disk via { uri, name, type } without triggering
    // Expo WinterCG fetch's "Unsupported FormDataPart implementation" error.
    try {
      await axios.post(uploadAuth.upload.url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: params.signal,
      });
    } catch (uploadErr: any) {
      if (
        params.signal?.aborted ||
        uploadErr?.name === "AbortError" ||
        uploadErr?.name === "CanceledError" ||
        uploadErr?.code === "ERR_CANCELED"
      ) {
        throw new Error("Upload was cancelled");
      }
      console.warn("[uploadMedia] Upload error:", uploadErr?.message);
      throw uploadErr;
    }

    if (params.signal?.aborted) {
      throw new Error("Upload was cancelled");
    }

    // Step 3: Complete verification
    return await mediaApi.completeUpload(uploadAuth.media.id);
  }

  // Already uploaded / deduplicated
  return uploadAuth.media;
}
