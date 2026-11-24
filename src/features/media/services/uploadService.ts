import axios from "axios";
import { generateUUID } from "@/shared/utils";
import { tokenStorage } from "@/services/api/token";
import { mediaApi } from "../api";
import {
  MediaAssetResponseDto,
  MediaContentType,
  MediaPurpose,
} from "../types";

export type UploadStage =
  | "idle"
  | "authorizing"
  | "authorized"
  | "transferred"
  | "completed";

export interface UploadStageProgress {
  stage: UploadStage;
  clientUploadId: string;
  mediaId?: string;
}

export interface UploadMediaParams {
  uri: string;
  purpose: MediaPurpose;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  clientUploadId?: string;
  signal?: AbortSignal;
  existingMediaId?: string;
  existingStage?: UploadStage;
  onStageChange?: (progress: UploadStageProgress) => void;
  sessionGeneration?: number;
  ownerId?: string;
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

/**
 * The backend returned an asset that cannot be attached yet (pending) or ever
 * (failed / deleted). `retryable` tells the UI whether Retry can succeed
 * without the user re-picking the file — it always can here: pending retries
 * completion only, failed/deleted re-uploads from the original local URI.
 */
export class MediaNotReadyError extends Error {
  readonly mediaId: string;
  readonly status: Exclude<MediaAssetResponseDto["status"], "ready">;
  readonly retryable = true;

  constructor(
    mediaId: string,
    status: Exclude<MediaAssetResponseDto["status"], "ready">,
  ) {
    super(
      status === "pending"
        ? "Attachment is still being processed. Tap retry to check again."
        : status === "failed"
          ? "The attachment could not be processed. Tap retry to upload it again."
          : "The attachment is no longer available. Tap retry to upload it again.",
    );
    this.name = "MediaNotReadyError";
    this.mediaId = mediaId;
    this.status = status;
  }
}

export function isMediaNotReadyError(error: unknown): error is MediaNotReadyError {
  return (error as { name?: unknown } | null)?.name === "MediaNotReadyError";
}

// Active controller registry to abort in-flight uploads on logout / session termination
const activeUploadControllers = new Set<AbortController>();

export function abortAllUploads(): void {
  activeUploadControllers.forEach((controller) => {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  });
  activeUploadControllers.clear();
}

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
 * 2. Statically binds session generation and lifecycle AbortSignals
 * 3. Requests upload credentials from backend (POST /v1/media/uploads)
 * 4. Handles already-ready (deduplicated) media without re-uploading
 * 5. Uploads file multipart payload directly to Cloudinary storage with AbortSignal cancellation
 * 6. Supports stage resumption: skips byte upload if stage is already "transferred"
 * 7. Completes upload verification with backend and returns confirmed MediaAssetResponseDto
 */
export async function uploadMedia(
  params: UploadMediaParams,
): Promise<MediaAssetResponseDto> {
  const internalController = new AbortController();
  activeUploadControllers.add(internalController);

  const onExternalAbort = () => {
    try {
      internalController.abort();
    } catch {
      // ignore
    }
  };

  if (params.signal) {
    if (params.signal.aborted) {
      activeUploadControllers.delete(internalController);
      throw new Error("Upload was cancelled");
    }
    params.signal.addEventListener("abort", onExternalAbort);
  }

  const checkCancelled = () => {
    if (internalController.signal.aborted || params.signal?.aborted) {
      throw new Error("Upload was cancelled");
    }
    if (params.sessionGeneration !== undefined) {
      const currentGen = tokenStorage.getSessionGeneration();
      if (currentGen !== params.sessionGeneration) {
        throw new Error("Upload aborted: Session generation mismatch");
      }
    }
  };

  try {
    checkCancelled();

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
    const sizeBytes =
      params.sizeBytes && params.sizeBytes > 0
        ? Math.min(params.sizeBytes, MAX_MEDIA_SIZE_BYTES)
        : 1024;

    const clientUploadId = params.clientUploadId || generateUUID();

    /**
     * R8: the single exit point for every path. Only a `ready` asset is
     * reported as completed and returned for submission.
     * - pending: bytes are on the server but not verified yet. Stay at
     *   "transferred" so Retry runs completion only (same media/message IDs).
     * - failed / deleted: the asset can never become usable. Reset to "idle"
     *   with a fresh clientUploadId so Retry uploads again instead of being
     *   deduplicated back to the dead asset.
     */
    const finalize = (asset: MediaAssetResponseDto): MediaAssetResponseDto => {
      checkCancelled();
      if (asset.status === "ready") {
        params.onStageChange?.({
          stage: "completed",
          clientUploadId,
          mediaId: asset.id,
        });
        return asset;
      }
      if (asset.status === "pending") {
        params.onStageChange?.({
          stage: "transferred",
          clientUploadId,
          mediaId: asset.id,
        });
      } else {
        params.onStageChange?.({
          stage: "idle",
          clientUploadId: generateUUID(),
        });
      }
      throw new MediaNotReadyError(asset.id, asset.status);
    };

    // F9 FIX: If bytes were already transferred, skip authorization and binary transfer!
    // Directly retry backend verification with the existing mediaId
    if (params.existingStage === "transferred" && params.existingMediaId) {
      checkCancelled();
      const verifiedMedia = await mediaApi.completeUpload(params.existingMediaId);
      return finalize(verifiedMedia);
    }

    // Step 1: Create upload authorization
    params.onStageChange?.({
      stage: "authorizing",
      clientUploadId,
    });
    checkCancelled();

    const uploadAuth = await mediaApi.createUpload({
      clientUploadId,
      purpose: params.purpose,
      contentType: mimeType,
      sizeBytes,
      originalFilename: fileName,
    });

    checkCancelled();
    params.onStageChange?.({
      stage: "authorized",
      clientUploadId,
      mediaId: uploadAuth.media.id,
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

      // Standalone Axios uses React Native's native XMLHttpRequest network layer, which streams
      // the local file directly from disk via { uri, name, type } without triggering
      // Expo WinterCG fetch's "Unsupported FormDataPart implementation" error.
      try {
        await axios.post(uploadAuth.upload.url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          signal: internalController.signal,
        });
      } catch (uploadErr: any) {
        if (
          internalController.signal.aborted ||
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

      checkCancelled();

      // F9 FIX: Persist that byte transfer succeeded BEFORE calling completeUpload
      params.onStageChange?.({
        stage: "transferred",
        clientUploadId,
        mediaId: uploadAuth.media.id,
      });

      // Step 3: Complete verification
      const verifiedMedia = await mediaApi.completeUpload(uploadAuth.media.id);
      return finalize(verifiedMedia);
    }

    // No transfer needed (deduplicated by clientUploadId). The authorization
    // response does not by itself mean the asset is usable.
    if (uploadAuth.media.status === "pending") {
      // Bytes already exist server-side; ask the backend to verify them.
      params.onStageChange?.({
        stage: "transferred",
        clientUploadId,
        mediaId: uploadAuth.media.id,
      });
      const verifiedMedia = await mediaApi.completeUpload(uploadAuth.media.id);
      return finalize(verifiedMedia);
    }
    return finalize(uploadAuth.media);
  } finally {
    if (params.signal) {
      params.signal.removeEventListener("abort", onExternalAbort);
    }
    activeUploadControllers.delete(internalController);
  }
}
