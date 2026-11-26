/**
 * R4 (remaining) — check ownership before writes inside asynchronous
 * optimistic setup.
 *
 * Optimistic onMutate callbacks await query cancellation and then write. If
 * logout/login happens during that await, nothing may be written: not into
 * the cache logout just cleared, and not into the next account's cache.
 */
import { queryClient } from "@/core/queryClient";
import { chatsApi } from "@/features/chats/api";
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import {
  useArchiveConversation,
  useSendMessage,
} from "@/features/chats/hooks/useConversationActions";
import {
  useDeleteMessage,
  useReactToMessage,
  useUpdateMessage,
} from "@/features/chats/hooks/useMessageActions";
import { MessageResponseDto } from "@/features/chats/types";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { deferred, flushAsync } from "../../../test-utils/deferred";
import { secureStoreMock } from "../../../test-utils/secureStoreMock";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);
jest.mock("@/features/chats/api");
jest.mock("@/features/settings/api", () => ({
  profileApi: { getMe: jest.fn(() => new Promise(() => {})) },
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const conversationId = "conv-1";
const historyKey = (userId: string) => [...chatsKeys.messages(conversationId), userId];

const message = (overrides: Partial<MessageResponseDto> = {}) =>
  ({
    id: "m1",
    conversationId,
    clientMessageId: "cm-1",
    senderId: "A",
    kind: "text",
    text: "original",
    reactions: [],
    version: 1,
    editedAt: null,
    deletedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    status: "sent",
    ...overrides,
  }) as MessageResponseDto;

const historyOf = (...items: MessageResponseDto[]) => ({
  pages: [{ items, pageInfo: { hasNextPage: false, nextCursor: null } }],
  pageParams: [undefined],
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

async function loginAs(userId: string) {
  await tokenStorage.setTokens(`${userId}-access`, `${userId}-refresh`);
  useAuthStore.setState({ isAuthenticated: true });
  queryClient.setQueryData(profileKeys.me(), { id: userId });
}

/** Holds the next cancelQueries call open until released. */
function holdNextCancellation() {
  const held = deferred<void>();
  jest.spyOn(queryClient, "cancelQueries").mockImplementationOnce(() => held.promise);
  return held;
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  secureStoreMock.reset();
  queryClient.clear();
  await loginAs("A");
});

afterEach(() => {
  queryClient.clear();
});

describe("R4: optimistic setup across logout", () => {
  it("send: logout during TanStack's real cancellation leaves the cache empty and sends nothing", async () => {
    queryClient.setQueryData(historyKey("A"), historyOf());
    const onSettled = jest.fn();
    const { result, unmount } = await renderHook(
      () => useSendMessage(conversationId, { onSettled }),
      { wrapper },
    );

    // Run logout exactly when the setup has started the real cancellation
    const realCancel = queryClient.cancelQueries.bind(queryClient);
    jest.spyOn(queryClient, "cancelQueries").mockImplementationOnce((...args) => {
      const cancellation = realCancel(...args);
      void useAuthStore.getState().logout();
      return cancellation;
    });

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = result.current.mutateAsync({ clientMessageId: "cm-1", text: "private" });
      settled.catch(() => {});
      await flushAsync();
    });

    await expect(settled).rejects.toMatchObject({ name: "StaleSessionError" });
    expect(queryClient.getQueryData(historyKey("A"))).toBeUndefined();
    // No private data anywhere (a still-mounted observer may re-create an empty query)
    expect(
      queryClient.getQueryCache().getAll().filter((q) => q.state.data !== undefined),
    ).toHaveLength(0);
    expect(chatsApi.sendMessage).not.toHaveBeenCalled();
    expect(onSettled).not.toHaveBeenCalled();
    await unmount();
  });

  type Case = {
    name: string;
    useHook: () => { mutate: (vars: any) => void };
    vars: Record<string, unknown>;
    api: jest.Mock;
  };
  const cases: Case[] = [
    {
      name: "edit",
      useHook: () => useUpdateMessage(conversationId),
      vars: { messageId: "m1", text: "A's old edit", expectedVersion: 1 },
      api: chatsApi.updateMessage as jest.Mock,
    },
    {
      name: "delete",
      useHook: () => useDeleteMessage(conversationId),
      vars: { messageId: "m1" },
      api: chatsApi.deleteMessage as jest.Mock,
    },
    {
      name: "reaction",
      useHook: () => useReactToMessage(conversationId),
      vars: { messageId: "m1", emoji: "👍" },
      api: chatsApi.addReaction as jest.Mock,
    },
  ];

  it.each(cases)(
    "$name: held setup released after logout + login as B does not touch B's shared-room cache",
    async ({ useHook, vars, api }) => {
      queryClient.setQueryData(historyKey("A"), historyOf(message()));
      const { result, unmount } = await renderHook(() => useHook(), { wrapper });

      const heldCancel = holdNextCancellation();
      await act(async () => {
        result.current.mutate(vars);
        await flushAsync();
      });

      await useAuthStore.getState().logout();
      await loginAs("B");
      const bHistory = historyOf(message({ senderId: "A", text: "B's view", version: 2 }));
      queryClient.setQueryData(historyKey("B"), bHistory);

      await act(async () => {
        heldCancel.resolve();
        await flushAsync();
      });

      expect(queryClient.getQueryData(historyKey("B"))).toEqual(bHistory);
      expect(queryClient.getQueryData(historyKey("A"))).toBeUndefined();
      expect(api).not.toHaveBeenCalled();
      await unmount();
    },
  );

  it("archive (useOptimisticMutation): held setup after logout + login as B leaves B's lists alone", async () => {
    const conv = { id: conversationId, settings: { archived: false, pinned: false }, lastActivityAt: null } as any;
    queryClient.setQueryData([...chatsKeys.list(), "A"], historyOf(conv));
    const onMutate = jest.fn();
    const { result, unmount } = await renderHook(
      () => useArchiveConversation(conversationId, { onMutate }),
      { wrapper },
    );

    const heldCancel = holdNextCancellation();
    await act(async () => {
      result.current.mutate();
      await flushAsync();
    });

    await useAuthStore.getState().logout();
    await loginAs("B");
    const bList = historyOf({ ...conv, otherParticipant: { id: "x" } });
    queryClient.setQueryData([...chatsKeys.list(), "B"], bList);

    await act(async () => {
      heldCancel.resolve();
      await flushAsync();
    });

    expect(queryClient.getQueryData([...chatsKeys.list(), "B"])).toEqual(bList);
    expect(queryClient.getQueryData([...chatsKeys.archived(), "B"])).toBeUndefined();
    expect(chatsApi.archiveConversation).not.toHaveBeenCalled();
    expect(onMutate).not.toHaveBeenCalled();
    await unmount();
  });

  it("control: an edit within the same session applies optimistically and then the server copy", async () => {
    queryClient.setQueryData(historyKey("A"), historyOf(message()));
    const server = deferred<MessageResponseDto>();
    (chatsApi.updateMessage as jest.Mock).mockReturnValueOnce(server.promise);
    const { result, unmount } = await renderHook(() => useUpdateMessage(conversationId), { wrapper });

    await act(async () => {
      result.current.mutate({ messageId: "m1", text: "edited", expectedVersion: 1 });
      await flushAsync();
    });
    const optimistic: any = queryClient.getQueryData(historyKey("A"));
    expect(optimistic.pages[0].items[0].text).toBe("edited");

    await act(async () => {
      server.resolve(message({ text: "edited", version: 2 }));
      await flushAsync();
    });
    const final: any = queryClient.getQueryData(historyKey("A"));
    expect(final.pages[0].items[0]).toMatchObject({ text: "edited", version: 2 });
    await unmount();
  });
});
