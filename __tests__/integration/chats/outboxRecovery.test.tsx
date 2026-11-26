/**
 * R7 — Turn interrupted persisted sends into visible, recoverable room state.
 *
 * Covers: offline cold restart with an empty query cache, leave/reopen while a
 * send is still running in-process, socket confirmation before the HTTP
 * response, and a lost HTTP response followed by Retry (one message).
 */
import { queryClient } from "@/core/queryClient";
import { chatsApi } from "@/features/chats/api";
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import { useChatRealtime } from "@/features/chats/hooks/useChatRealtime";
import { useSendMessage } from "@/features/chats/hooks/useConversationActions";
import {
  mergeOutboxIntoHistory,
  useOutboxMessages,
} from "@/features/chats/hooks/useOutboxMessages";
import { useSendChatMessage } from "@/features/chats/hooks/useSendChatMessage";
import {
  INTERRUPTED_SEND_ERROR,
  OutboxEntry,
  useChatOutboxStore,
} from "@/features/chats/store/useChatOutboxStore";
import { MessageHistoryResponseDto, MessageResponseDto } from "@/features/chats/types";
import { mediaApi } from "@/features/media/api";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { InfiniteData, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import axios from "axios";
import React from "react";
import { deferred, flushAsync } from "../../../test-utils/deferred";
import { secureStoreMock } from "../../../test-utils/secureStoreMock";
import { resetQueryClient } from "../../../test-utils/queryClient";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);
jest.mock("@/features/chats/api");
jest.mock("@/features/media/api");
jest.mock("@/features/settings/api", () => ({
  profileApi: { getMe: jest.fn(() => new Promise(() => {})) },
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockSocketHandlers = new Map<string, (payload: any) => void>();
jest.mock("@/core/providers/RealtimeProvider", () => {
  // Stable identity, like the real provider's context value
  const realtime = {
    socket: {
      on: (event: string, handler: (p: any) => void) => mockSocketHandlers.set(event, handler),
      off: (event: string) => mockSocketHandlers.delete(event),
      emit: () => {},
    },
    reconcileVersion: 0,
  };
  return { useRealtime: () => realtime };
});

const OUTBOX_KEY = "chat_outbox_v1";
const owner = "A";
const conversationId = "conv-1";
const msgKey = [...chatsKeys.messages(conversationId), owner];

const entry = (overrides: Partial<OutboxEntry> = {}): OutboxEntry => ({
  clientMessageId: "cm-1",
  ownerId: owner,
  conversationId,
  text: "hello",
  status: "pending",
  createdAt: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

const serverMessage = (overrides: Partial<MessageResponseDto> = {}) =>
  ({
    id: "srv-1",
    conversationId,
    clientMessageId: "cm-1",
    senderId: owner,
    kind: "text",
    text: "hello",
    createdAt: "2026-01-01T12:00:01.000Z",
    ...overrides,
  }) as MessageResponseDto;

const historyItems = () =>
  queryClient
    .getQueryData<InfiniteData<MessageHistoryResponseDto>>(msgKey)
    ?.pages.flatMap((p) => p.items) ?? [];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

let transferSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.clearAllMocks();
  mockSocketHandlers.clear();
  secureStoreMock.reset();
  resetQueryClient(queryClient);
  useChatOutboxStore.getState().clearActiveSession();
  await tokenStorage.setTokens("A-access", "A-refresh");
  useAuthStore.setState({ isAuthenticated: true });
  queryClient.setQueryData(profileKeys.me(), { id: owner });
  transferSpy = jest.spyOn(axios, "post").mockResolvedValue({ status: 200, data: {} });
});

afterEach(() => {
  transferSpy.mockRestore();
  resetQueryClient(queryClient);
});

describe("R7: interrupted sends after process termination", () => {
  it("offline cold restart with empty cache: a pending send is shown as failed + retryable", () => {
    let persisted: string | undefined;

    // Process 1: the send is pending when the app is killed
    jest.isolateModules(() => {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { useChatOutboxStore: store } = require("@/features/chats/store/useChatOutboxStore");
      store.getState().addOutboxEntry(
        entry({ attachment: { uri: "file:///p.jpg" }, clientUploadId: "cu-1", uploadedMediaId: "m1", uploadStage: "transferred" }),
      );
      persisted = require("react-native-mmkv").createMMKV().getString(OUTBOX_KEY);
    });
    expect(persisted).toBeDefined();

    // Process 2: fresh store, nothing in the query cache, history never loads
    jest.isolateModules(() => {
      require("react-native-mmkv").createMMKV().set(OUTBOX_KEY, persisted);
      const { useChatOutboxStore: store } = require("@/features/chats/store/useChatOutboxStore");
      const { mergeOutboxIntoHistory: merge } = require("@/features/chats/hooks/useOutboxMessages");
      /* eslint-enable @typescript-eslint/no-require-imports */

      const [restored] = store.getState().getConversationOutbox(owner, conversationId);
      expect(restored).toMatchObject({
        status: "failed",
        interrupted: true,
        error: INTERRUPTED_SEND_ERROR,
        // checkpoint and identity preserved
        clientMessageId: "cm-1",
        clientUploadId: "cu-1",
        uploadedMediaId: "m1",
        uploadStage: "transferred",
        text: "hello",
      });

      const { messages } = merge(undefined, store.getState().getAllOutboxEntries(owner), owner, conversationId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ clientMessageId: "cm-1", status: "failed", text: "hello" });
    });
  });

  it("Retry of an interrupted media send resumes at completion with the original IDs", async () => {
    useChatOutboxStore.getState().addOutboxEntry(
      entry({
        status: "failed",
        interrupted: true,
        attachment: { uri: "file:///p.jpg", mimeType: "image/jpeg" },
        clientUploadId: "cu-1",
        uploadedMediaId: "m1",
        uploadStage: "transferred",
      }),
    );
    (mediaApi.completeUpload as jest.Mock).mockResolvedValueOnce({ id: "m1", status: "ready" });
    const sendMessageMutation = { mutate: jest.fn(), isPending: false };

    const { result, unmount } = await renderHook(
      () => useSendChatMessage({ conversationId, sendMessageMutation, sendTypingStop: jest.fn() }),
      { wrapper },
    );
    await act(async () => {
      await result.current.handleRetryMessage("cm-1");
      await flushAsync();
    });

    expect(mediaApi.createUpload).not.toHaveBeenCalled();
    expect(transferSpy).not.toHaveBeenCalled();
    expect(mediaApi.completeUpload).toHaveBeenCalledWith("m1");
    expect(sendMessageMutation.mutate).toHaveBeenCalledTimes(1);
    expect(sendMessageMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ clientMessageId: "cm-1", text: "hello", attachmentMediaIds: ["m1"] }),
    );
    expect(useChatOutboxStore.getState().getOutboxEntry("cm-1")?.interrupted).toBeUndefined();
    await unmount();
  });

  it("leave/reopen while sending: an in-process send stays pending, not failed", async () => {
    // Added in THIS process (not hydrated) -> still actively sending
    useChatOutboxStore.getState().addOutboxEntry(entry());

    const { result, unmount } = await renderHook(
      () => useOutboxMessages(undefined, owner, conversationId),
      { wrapper },
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({ clientMessageId: "cm-1", status: "pending" });
    await unmount();
  });

  it("a stale optimistic copy in persisted history follows the outbox status", () => {
    const staleTemp = { ...serverMessage(), id: "temp_123", status: "pending" } as MessageResponseDto;
    const { messages } = mergeOutboxIntoHistory(
      [staleTemp],
      [entry({ status: "failed", interrupted: true })],
      owner,
      conversationId,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ id: "temp_123", status: "failed" });
  });

  it("only projects the current owner's entries", () => {
    const { messages } = mergeOutboxIntoHistory(
      [],
      [entry({ ownerId: "B", clientMessageId: "cm-b", status: "failed" })],
      owner,
      conversationId,
    );
    expect(messages).toHaveLength(0);
  });
});

describe("R7: confirmation ordering", () => {
  it("socket confirmation before a lost HTTP response leaves exactly one sent message", async () => {
    const http = deferred<MessageResponseDto>();
    (chatsApi.sendMessage as jest.Mock).mockReturnValueOnce(http.promise);
    useChatOutboxStore.getState().addOutboxEntry(entry());

    const { result, unmount } = await renderHook(
      () => {
        useChatRealtime(conversationId);
        const send = useSendMessage(conversationId);
        const history = queryClient
          .getQueryData<InfiniteData<MessageHistoryResponseDto>>(msgKey)
          ?.pages.flatMap((p) => p.items);
        return { send, visible: useOutboxMessages(history, owner, conversationId) };
      },
      { wrapper },
    );

    await act(async () => {
      result.current.send.mutate({ clientMessageId: "cm-1", text: "hello" });
      await flushAsync();
    });

    // Server broadcasts our message before the HTTP response arrives
    await act(async () => {
      mockSocketHandlers.get("message.created")!(serverMessage());
      await flushAsync();
    });
    expect(useChatOutboxStore.getState().getOutboxEntry("cm-1")?.status).toBe("sent");

    // ...and then the HTTP response is lost
    await act(async () => {
      http.reject(new Error("Network Error"));
      await flushAsync();
    });

    expect(useChatOutboxStore.getState().getOutboxEntry("cm-1")?.status).toBe("sent");
    const copies = historyItems().filter((m) => m.clientMessageId === "cm-1");
    expect(copies).toHaveLength(1);
    expect(copies[0].id).toBe("srv-1");
    expect(copies[0].status).not.toBe("failed");
    await unmount();
  });

  it("lost HTTP response then Retry: same clientMessageId, one message in history", async () => {
    (chatsApi.sendMessage as jest.Mock)
      .mockRejectedValueOnce(new Error("Network Error")) // server got it, response lost
      .mockResolvedValueOnce(serverMessage()); // server dedupes by clientMessageId
    useChatOutboxStore.getState().addOutboxEntry(entry());

    const { result, unmount } = await renderHook(
      () => {
        const sendMessageMutation = useSendMessage(conversationId);
        const chat = useSendChatMessage({ conversationId, sendMessageMutation, sendTypingStop: jest.fn() });
        return { sendMessageMutation, chat };
      },
      { wrapper },
    );

    await act(async () => {
      result.current.sendMessageMutation.mutate({ clientMessageId: "cm-1", text: "hello" });
      await flushAsync();
    });
    expect(useChatOutboxStore.getState().getOutboxEntry("cm-1")?.status).toBe("failed");
    expect(historyItems().filter((m) => m.clientMessageId === "cm-1")[0].status).toBe("failed");

    await act(async () => {
      await result.current.chat.handleRetryMessage("cm-1");
      await flushAsync();
    });

    const sentPayloads = (chatsApi.sendMessage as jest.Mock).mock.calls.map((c) => c[1]);
    expect(sentPayloads).toEqual([
      expect.objectContaining({ clientMessageId: "cm-1", text: "hello" }),
      expect.objectContaining({ clientMessageId: "cm-1", text: "hello" }),
    ]);
    const copies = historyItems().filter((m) => m.clientMessageId === "cm-1");
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({ id: "srv-1", status: "sent" });
    expect(useChatOutboxStore.getState().getOutboxEntry("cm-1")?.status).toBe("sent");
    await unmount();
  });
});
