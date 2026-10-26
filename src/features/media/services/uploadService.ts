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
}

const VALID_MEDIA_CONTENT_TYPES: MediaContentType[] = [
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
 * 1. Requests upload credentials from backend (POST /v1/media/uploads)
 * 2. Uploads file multipart payload directly to S3/Cloudinary storage
 * 3. Completes upload verification with backend and returns confirmed MediaAssetResponseDto
 */
export async function uploadMedia(
  params: UploadMediaParams,
): Promise<MediaAssetResponseDto> {
  const { mimeType, fileName } = resolveContentTypeAndFilename(
    params.uri,
    params.mimeType,
    params.fileName,
  );
  // Ensure size is at least 1 byte and doesn't exceed backend max limit (50 MiB)
  const sizeBytes = Math.min(Math.max(1, params.sizeBytes || 500000), 52428800);

  // Step 1: Create upload authorization
  const uploadAuth = await mediaApi.createUpload({
    clientUploadId: generateUUID(),
    purpose: params.purpose,
    contentType: mimeType,
    sizeBytes,
    originalFilename: fileName,
  });

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

    try {
      // Use native fetch first: React Native handles FormData boundary generation correctly
      const uploadRes = await fetch(uploadAuth.upload.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.warn("[uploadMedia] Native fetch failed, trying axios fallback. Response:", errText);
        await axios.post(uploadAuth.upload.url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    } catch (fetchErr: any) {
      console.warn("[uploadMedia] Native fetch error, trying axios fallback:", fetchErr?.message);
      await axios.post(uploadAuth.upload.url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    // Step 3: Complete verification
    return await mediaApi.completeUpload(uploadAuth.media.id);
  }

  // Already uploaded / deduplicated
  return uploadAuth.media;
}
