import axios from "axios";
import {
  uploadMedia,
  abortAllUploads,
  UploadStageProgress,
} from "@/features/media/services/uploadService";
import { mediaApi } from "@/features/media/api";
import {
  MediaAssetResponseDto,
  CloudinaryUploadAuthorizationDto,
} from "@/features/media/types";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatOutboxStore } from "@/features/chats/store/useChatOutboxStore";

jest.mock("@/features/media/api");

const mockedMediaApi = mediaApi as jest.Mocked<typeof mediaApi>;

function createMockMediaAsset(
  overrides?: Partial<MediaAssetResponseDto>,
): MediaAssetResponseDto {
  return {
    id: "media-uuid-1",
    purpose: "message_attachment",
    status: "pending",
    type: "image",
    contentType: "image/jpeg",
    sizeBytes: 2048,
    originalFilename: "file1.jpg",
    width: 800,
    height: 600,
    durationMs: null,
    secureUrl: "https://cloud.example.com/file1.jpg",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    completedAt: null,
    ...overrides,
  };
}

const mockUploadAuth: CloudinaryUploadAuthorizationDto = {
  url: "https://upload.example.com/post",
  method: "POST",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  fields: {
    api_key: "key123",
    timestamp: "1234567890",
    signature: "sig123",
    public_id: "pub123",
    context: "",
    type: "upload",
    overwrite: "true",
    allowed_formats: "jpg,png",
    upload_preset: "preset123",
  },
};

describe("Media Upload Lifecycle - F8 & F9", () => {
  let postSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    abortAllUploads();
    useChatOutboxStore.getState().clearActiveSession();
    await tokenStorage.clearTokens();
    postSpy = jest.spyOn(axios, "post");
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  describe("F8: Stop Ended Session's In-Flight Upload", () => {
    it("aborts in-flight upload when logout is called mid-transfer", async () => {
      await tokenStorage.setTokens("token-user-a", "refresh-user-a");
      const sessionGenA = tokenStorage.getSessionGeneration();

      // Mock createUpload success
      mockedMediaApi.createUpload.mockResolvedValueOnce({
        media: createMockMediaAsset({ id: "media-uuid-1" }),
        upload: mockUploadAuth,
      });

      // Mock axios.post to reject when signal is aborted
      postSpy.mockImplementationOnce((_url, _data, config) => {
        return new Promise((_, reject) => {
          if (config?.signal) {
            config.signal.addEventListener("abort", () => {
              const err: any = new Error("Upload was cancelled");
              err.name = "CanceledError";
              reject(err);
            });
          }
        });
      });

      const uploadPromise = uploadMedia({
        uri: "file:///path/to/image.jpg",
        purpose: "message_attachment",
        sessionGeneration: sessionGenA,
        ownerId: "user-a-id",
      });

      // Trigger logout while upload is in-flight
      await useAuthStore.getState().logout();

      await expect(uploadPromise).rejects.toThrow("Upload was cancelled");
      // completeUpload should NEVER have been called
      expect(mockedMediaApi.completeUpload).not.toHaveBeenCalled();
    });

    it("rejects post-await continuation if session generation changed", async () => {
      await tokenStorage.setTokens("token-user-a", "refresh-user-a");
      const sessionGenA = tokenStorage.getSessionGeneration();

      mockedMediaApi.createUpload.mockImplementationOnce(async () => {
        // Simulate session rotation during createUpload
        tokenStorage.incrementSessionGeneration();
        return {
          media: createMockMediaAsset({ id: "media-uuid-1" }),
          upload: null,
        };
      });

      await expect(
        uploadMedia({
          uri: "file:///path/to/image.jpg",
          purpose: "message_attachment",
          sessionGeneration: sessionGenA,
        }),
      ).rejects.toThrow("Session generation mismatch");

      expect(postSpy).not.toHaveBeenCalled();
    });
  });

  describe("F9: Persist Transfer Progress When Completion Fails & Skip Byte Re-transfer on Retry", () => {
    it("persists transferred stage on verification failure and skips byte upload on retry", async () => {
      await tokenStorage.setTokens("token-user-a", "refresh-user-a");
      const currentGen = tokenStorage.getSessionGeneration();

      const stagesEmitted: UploadStageProgress[] = [];
      const onStageChange = jest.fn((progress: UploadStageProgress) => {
        stagesEmitted.push(progress);
      });

      // Step 1: createUpload succeeds
      mockedMediaApi.createUpload.mockResolvedValueOnce({
        media: createMockMediaAsset({ id: "media-to-verify-99" }),
        upload: mockUploadAuth,
      });

      // Step 2: Binary transfer succeeds
      postSpy.mockResolvedValueOnce({ status: 200, data: {} });

      // Step 3: Verification (completeUpload) fails with 500
      mockedMediaApi.completeUpload.mockRejectedValueOnce(
        new Error("Backend verification timeout (500)"),
      );

      // Initial upload attempt
      await expect(
        uploadMedia({
          uri: "file:///path/to/attachment.png",
          purpose: "message_attachment",
          clientUploadId: "stable-client-upload-id-1",
          sessionGeneration: currentGen,
          onStageChange,
        }),
      ).rejects.toThrow("Backend verification timeout (500)");

      // Verify progress before failure:
      // It should have recorded authorizing, authorized, AND transferred!
      expect(stagesEmitted.map((s) => s.stage)).toEqual([
        "authorizing",
        "authorized",
        "transferred",
      ]);
      expect(stagesEmitted[2]).toEqual({
        stage: "transferred",
        clientUploadId: "stable-client-upload-id-1",
        mediaId: "media-to-verify-99",
      });

      // Exactly 1 binary transfer occurred
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(mockedMediaApi.createUpload).toHaveBeenCalledTimes(1);

      // RETRY ATTEMPT:
      // Caller uses the persisted progress: stage="transferred" and mediaId="media-to-verify-99"
      mockedMediaApi.completeUpload.mockResolvedValueOnce(
        createMockMediaAsset({
          id: "media-to-verify-99",
          status: "ready",
          contentType: "image/png",
        }),
      );

      const retryResult = await uploadMedia({
        uri: "file:///path/to/attachment.png",
        purpose: "message_attachment",
        clientUploadId: "stable-client-upload-id-1",
        existingMediaId: "media-to-verify-99",
        existingStage: "transferred",
        sessionGeneration: currentGen,
        onStageChange,
      });

      // Verification succeeded!
      expect(retryResult.status).toBe("ready");
      expect(retryResult.id).toBe("media-to-verify-99");

      // CRITICAL ASSERTION:
      // Byte transfer (postSpy) must NOT have been called again!
      // Total binary transfers across both attempts remains exactly 1!
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(mockedMediaApi.createUpload).toHaveBeenCalledTimes(1);
      expect(mockedMediaApi.completeUpload).toHaveBeenCalledTimes(2);

      expect(stagesEmitted[stagesEmitted.length - 1]).toEqual({
        stage: "completed",
        clientUploadId: "stable-client-upload-id-1",
        mediaId: "media-to-verify-99",
      });
    });
  });
});
