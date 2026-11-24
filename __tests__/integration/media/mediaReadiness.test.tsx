/**
 * R8 — Require ready media before recording completion or submitting it.
 *
 * Service level: every completion path (fresh upload, completion-only retry,
 * deduplicated authorization) only reports "completed" for status=ready.
 * Hook level: the production send hook never submits a message with a
 * non-ready media ID, and Retry recovers a pending asset with completion only.
 */
import { queryClient } from "@/core/queryClient";
import { useSendChatMessage } from "@/features/chats/hooks/useSendChatMessage";
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import { useChatOutboxStore } from "@/features/chats/store/useChatOutboxStore";
import { mediaApi } from "@/features/media/api";
import {
  isMediaNotReadyError,
  uploadMedia,
  UploadStageProgress,
} from "@/features/media/services/uploadService";
import {
  CloudinaryUploadAuthorizationDto,
  MediaAssetResponseDto,
} from "@/features/media/types";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import axios from "axios";
import React from "react";
import { flushAsync } from "../../../test-utils/deferred";
import { secureStoreMock } from "../../../test-utils/secureStoreMock";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);
jest.mock("@/features/media/api");
jest.mock("@/features/settings/api", () => ({
  profileApi: { getMe: jest.fn(() => new Promise(() => {})) },
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const api = mediaApi as jest.Mocked<typeof mediaApi>;
type Status = MediaAssetResponseDto["status"];

const asset = (id: string, status: Status): MediaAssetResponseDto => ({
  id,
  purpose: "message_attachment",
  status,
  type: "image",
  contentType: "image/jpeg",
  sizeBytes: 2048,
  originalFilename: "photo.jpg",
  width: 10,
  height: 10,
  durationMs: null,
  secureUrl: status === "ready" ? `https://cdn.example.com/${id}.jpg` : null,
  createdAt: new Date(0).toISOString(),
  expiresAt: new Date(0).toISOString(),
  completedAt: null,
} as MediaAssetResponseDto);

const uploadAuth = {
  url: "https://upload.example.com",
  method: "POST",
  expiresAt: new Date(0).toISOString(),
  fields: {},
} as unknown as CloudinaryUploadAuthorizationDto;

let transferSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.clearAllMocks();
  secureStoreMock.reset();
  queryClient.clear();
  useChatOutboxStore.getState().clearActiveSession();
  await tokenStorage.setTokens("A-access", "A-refresh");
  useAuthStore.setState({ isAuthenticated: true });
  transferSpy = jest.spyOn(axios, "post").mockResolvedValue({ status: 200, data: {} });
});

afterEach(() => {
  transferSpy.mockRestore();
  queryClient.clear();
});

function recordStages() {
  const stages: UploadStageProgress[] = [];
  return { stages, onStageChange: (p: UploadStageProgress) => stages.push(p) };
}

describe("R8: uploadService only completes ready media", () => {
  it("fresh upload: pending completion is not recorded as completed and stays retryable", async () => {
    api.createUpload.mockResolvedValueOnce({ media: asset("m1", "pending"), upload: uploadAuth });
    api.completeUpload.mockResolvedValueOnce(asset("m1", "pending"));
    const { stages, onStageChange } = recordStages();

    const error = await uploadMedia({
      uri: "file:///photo.jpg",
      purpose: "message_attachment",
      clientUploadId: "cu-1",
      onStageChange,
    }).catch((e) => e);

    expect(isMediaNotReadyError(error)).toBe(true);
    expect(error).toMatchObject({ status: "pending", mediaId: "m1" });
    expect(stages.map((s) => s.stage)).not.toContain("completed");
    expect(stages[stages.length - 1]).toEqual({
      stage: "transferred",
      clientUploadId: "cu-1",
      mediaId: "m1",
    });
  });

  it.each(["failed", "deleted"] as const)(
    "fresh upload: %s completion resets to a fresh upload with a new clientUploadId",
    async (status) => {
      api.createUpload.mockResolvedValueOnce({ media: asset("m1", "pending"), upload: uploadAuth });
      api.completeUpload.mockResolvedValueOnce(asset("m1", status));
      const { stages, onStageChange } = recordStages();

      const error = await uploadMedia({
        uri: "file:///photo.jpg",
        purpose: "message_attachment",
        clientUploadId: "cu-1",
        onStageChange,
      }).catch((e) => e);

      expect(error).toMatchObject({ name: "MediaNotReadyError", status });
      const last = stages[stages.length - 1];
      expect(last.stage).toBe("idle");
      expect(last.clientUploadId).not.toBe("cu-1");
      expect(last.mediaId).toBeUndefined();
    },
  );

  it("completion-only retry: pending stays transferred; ready completes; no re-authorization or re-transfer", async () => {
    api.completeUpload
      .mockResolvedValueOnce(asset("m1", "pending"))
      .mockResolvedValueOnce(asset("m1", "ready"));
    const retry = () => {
      const rec = recordStages();
      const run = uploadMedia({
        uri: "file:///photo.jpg",
        purpose: "message_attachment",
        clientUploadId: "cu-1",
        existingMediaId: "m1",
        existingStage: "transferred",
        onStageChange: rec.onStageChange,
      });
      return { run, stages: rec.stages };
    };

    const first = retry();
    await expect(first.run).rejects.toMatchObject({ status: "pending" });
    expect(first.stages.map((s) => s.stage)).toEqual(["transferred"]);

    const second = retry();
    await expect(second.run).resolves.toMatchObject({ id: "m1", status: "ready" });
    expect(second.stages.map((s) => s.stage)).toEqual(["completed"]);

    expect(api.createUpload).not.toHaveBeenCalled();
    expect(transferSpy).not.toHaveBeenCalled();
    expect(api.completeUpload).toHaveBeenCalledTimes(2);
  });

  it("deduplicated authorization: ready completes without a completion call", async () => {
    api.createUpload.mockResolvedValueOnce({ media: asset("m1", "ready"), upload: null });
    const { stages, onStageChange } = recordStages();

    await expect(
      uploadMedia({ uri: "file:///photo.jpg", purpose: "message_attachment", onStageChange }),
    ).resolves.toMatchObject({ status: "ready" });
    expect(api.completeUpload).not.toHaveBeenCalled();
    expect(stages[stages.length - 1].stage).toBe("completed");
  });

  it("deduplicated authorization: pending is verified via completion before use", async () => {
    api.createUpload.mockResolvedValue({ media: asset("m1", "pending"), upload: null });
    api.completeUpload
      .mockResolvedValueOnce(asset("m1", "pending"))
      .mockResolvedValueOnce(asset("m1", "ready"));

    await expect(
      uploadMedia({ uri: "file:///photo.jpg", purpose: "message_attachment" }),
    ).rejects.toMatchObject({ status: "pending" });
    await expect(
      uploadMedia({ uri: "file:///photo.jpg", purpose: "message_attachment" }),
    ).resolves.toMatchObject({ status: "ready" });
    expect(transferSpy).not.toHaveBeenCalled();
  });

  it.each(["failed", "deleted"] as const)(
    "deduplicated authorization: %s is reported, not completed",
    async (status) => {
      api.createUpload.mockResolvedValueOnce({ media: asset("m1", status), upload: null });
      const { stages, onStageChange } = recordStages();

      await expect(
        uploadMedia({ uri: "file:///photo.jpg", purpose: "message_attachment", onStageChange }),
      ).rejects.toMatchObject({ status });
      expect(stages.map((s) => s.stage)).not.toContain("completed");
      expect(api.completeUpload).not.toHaveBeenCalled();
    },
  );
});

describe("R8: send hook never submits non-ready media", () => {
  const conversationId = "conv-1";
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("marks the message failed on pending verification, then Retry completes and submits once", async () => {
    queryClient.setQueryData(profileKeys.me(), { id: "A" });
    const sendMessageMutation = { mutate: jest.fn(), isPending: false };
    api.createUpload.mockResolvedValueOnce({ media: asset("m1", "pending"), upload: uploadAuth });
    api.completeUpload
      .mockResolvedValueOnce(asset("m1", "pending"))
      .mockResolvedValueOnce(asset("m1", "ready"));

    const { result, unmount } = await renderHook(
      () =>
        useSendChatMessage({
          conversationId,
          sendMessageMutation,
          sendTypingStop: jest.fn(),
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.setSelectedAttachment({ uri: "file:///photo.jpg", mimeType: "image/jpeg" });
    });
    await act(async () => {
      await result.current.handleSendMessage();
      await flushAsync();
    });

    expect(sendMessageMutation.mutate).not.toHaveBeenCalled();
    const [entry] = useChatOutboxStore.getState().getConversationOutbox("A", conversationId);
    expect(entry).toMatchObject({ status: "failed", uploadStage: "transferred", uploadedMediaId: "m1" });

    const history: any = queryClient.getQueryData([...chatsKeys.messages(conversationId), "A"]);
    expect(history.pages[0].items[0]).toMatchObject({
      clientMessageId: entry.clientMessageId,
      status: "failed",
    });

    await act(async () => {
      await result.current.handleRetryMessage(entry.clientMessageId);
      await flushAsync();
    });

    expect(sendMessageMutation.mutate).toHaveBeenCalledTimes(1);
    expect(sendMessageMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientMessageId: entry.clientMessageId,
        attachmentMediaIds: ["m1"],
      }),
    );
    // One authorization, one byte transfer, two completion attempts
    expect(api.createUpload).toHaveBeenCalledTimes(1);
    expect(transferSpy).toHaveBeenCalledTimes(1);
    expect(api.completeUpload).toHaveBeenCalledTimes(2);
    await unmount();
  });
});
