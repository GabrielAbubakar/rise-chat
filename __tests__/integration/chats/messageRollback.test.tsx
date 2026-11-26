/**
 * R10 — Roll back only the failed optimistic operation, preserving newer
 * confirmed versions.
 *
 * Uses the production edit/delete/reaction hooks and the production
 * `applyServerMessage` cache path. Nothing relies on a refetch to repair the
 * cache: every assertion is on the cache right after the failure settles.
 */
import { queryClient } from "@/core/queryClient";
import { chatsApi } from "@/features/chats/api";
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import { applyServerMessage } from "@/features/chats/hooks/messageCache";
import {
  useDeleteMessage,
  useReactToMessage,
  useUpdateMessage,
} from "@/features/chats/hooks/useMessageActions";
import { MessageHistoryResponseDto, MessageResponseDto } from "@/features/chats/types";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { InfiniteData, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { Deferred, deferred, flushAsync } from "../../../test-utils/deferred";
import { secureStoreMock } from "../../../test-utils/secureStoreMock";
import { resetQueryClient } from "../../../test-utils/queryClient";

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

const me = "A";
const conversationId = "conv-1";
const historyKey = [...chatsKeys.messages(conversationId), me];
const singleKey = chatsKeys.message(conversationId, "m1");

const v1 = (overrides: Partial<MessageResponseDto> = {}) =>
  ({
    id: "m1",
    conversationId,
    clientMessageId: "cm-1",
    senderId: me,
    kind: "text",
    text: "original",
    attachments: [],
    reactions: [],
    version: 1,
    editedAt: null,
    deletedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    status: "sent",
    ...overrides,
  }) as MessageResponseDto;

const other = (id: string) => v1({ id, clientMessageId: `cm-${id}`, text: id });

/** Two pages, target on the second, to check pagination survives. */
function seedCache(message = v1()) {
  queryClient.setQueryData<InfiniteData<MessageHistoryResponseDto>>(historyKey, {
    pages: [
      { items: [other("m3"), other("m2")], pageInfo: { hasNextPage: true, nextCursor: "c1" } },
      { items: [message, other("m0")], pageInfo: { hasNextPage: false, nextCursor: null } },
    ],
    pageParams: [undefined, "c1"],
  } as any);
  queryClient.setQueryData(singleKey, message);
}

const inHistory = () =>
  queryClient
    .getQueryData<InfiniteData<MessageHistoryResponseDto>>(historyKey)!
    .pages.flatMap((p) => p.items)
    .find((m) => m.id === "m1")!;
const inSingle = () => queryClient.getQueryData<MessageResponseDto>(singleKey)!;
const pageShape = () =>
  queryClient
    .getQueryData<InfiniteData<MessageHistoryResponseDto>>(historyKey)!
    .pages.map((p) => p.items.map((m) => m.id));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

/** Each API call returns the next held promise, in call order. */
function holdCalls(api: jest.Mock, count: number): Deferred<MessageResponseDto>[] {
  const held = Array.from({ length: count }, () => deferred<MessageResponseDto>());
  held.forEach((d) => api.mockReturnValueOnce(d.promise));
  return held;
}

async function renderActions() {
  return renderHook(
    () => ({
      edit: useUpdateMessage(conversationId),
      remove: useDeleteMessage(conversationId),
      react: useReactToMessage(conversationId),
    }),
    { wrapper },
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  secureStoreMock.reset();
  resetQueryClient(queryClient);
  await tokenStorage.setTokens("A-access", "A-refresh");
  useAuthStore.setState({ isAuthenticated: true });
  queryClient.setQueryData(profileKeys.me(), { id: me });
  seedCache();
});

afterEach(() => resetQueryClient(queryClient));

const confirmedDeletionV3 = () =>
  v1({ version: 3, text: null, deletedAt: "2026-01-01T12:05:00.000Z", attachments: [], reactions: [] });

describe("R10: a failed action never overwrites a newer confirmed version", () => {
  const actions = [
    {
      name: "edit",
      api: () => chatsApi.updateMessage as jest.Mock,
      run: (r: any) => r.edit.mutate({ messageId: "m1", text: "my edit", expectedVersion: 1 }),
    },
    {
      name: "delete",
      api: () => chatsApi.deleteMessage as jest.Mock,
      run: (r: any) => r.remove.mutate({ messageId: "m1" }),
    },
    {
      name: "reaction",
      api: () => chatsApi.addReaction as jest.Mock,
      run: (r: any) => r.react.mutate({ messageId: "m1", emoji: "👍" }),
    },
  ];

  it.each(actions)(
    "$name: rejected after a confirmed v3 deletion arrived -> stays deleted at v3",
    async ({ api, run }) => {
      const [held] = holdCalls(api(), 1);
      const { result, unmount } = await renderActions();

      await act(async () => {
        run(result.current);
        await flushAsync();
      });
      // Another device deletes the message; the confirmed copy arrives
      await act(async () => {
        applyServerMessage(queryClient, confirmedDeletionV3());
      });

      await act(async () => {
        held.reject(new Error("409 conflict"));
        await flushAsync();
      });

      for (const copy of [inHistory(), inSingle()]) {
        expect(copy).toMatchObject({ version: 3, text: null, deletedAt: "2026-01-01T12:05:00.000Z" });
      }
      expect(pageShape()).toEqual([["m3", "m2"], ["m1", "m0"]]);
      await unmount();
    },
  );

  it.each(actions)("$name: rejected with nothing newer -> restores the original", async ({ api, run }) => {
    const [held] = holdCalls(api(), 1);
    const { result, unmount } = await renderActions();

    await act(async () => {
      run(result.current);
      await flushAsync();
    });
    await act(async () => {
      held.reject(new Error("500"));
      await flushAsync();
    });

    for (const copy of [inHistory(), inSingle()]) {
      expect(copy).toMatchObject({ version: 1, text: "original", deletedAt: null, reactions: [] });
    }
    expect(pageShape()).toEqual([["m3", "m2"], ["m1", "m0"]]);
    await unmount();
  });
});

describe("R10: overlapping operations settle correctly in either order", () => {
  it("two edits: first fails, then second fails -> original text", async () => {
    const [first, second] = holdCalls(chatsApi.updateMessage as jest.Mock, 2);
    const { result, unmount } = await renderActions();

    await act(async () => {
      result.current.edit.mutate({ messageId: "m1", text: "a", expectedVersion: 1 });
      await flushAsync();
      result.current.edit.mutate({ messageId: "m1", text: "b", expectedVersion: 1 });
      await flushAsync();
    });
    expect(inHistory().text).toBe("b");

    await act(async () => {
      first.reject(new Error("fail a"));
      await flushAsync();
    });
    expect(inHistory().text).toBe("b"); // the newer pending edit still owns the text

    await act(async () => {
      second.reject(new Error("fail b"));
      await flushAsync();
    });
    // Not "a": the first edit failed too, so the baseline is the original
    expect(inHistory().text).toBe("original");
    expect(inSingle().text).toBe("original");
    await unmount();
  });

  it("two edits: second fails first, then first fails -> original text", async () => {
    const [first, second] = holdCalls(chatsApi.updateMessage as jest.Mock, 2);
    const { result, unmount } = await renderActions();

    await act(async () => {
      result.current.edit.mutate({ messageId: "m1", text: "a", expectedVersion: 1 });
      await flushAsync();
      result.current.edit.mutate({ messageId: "m1", text: "b", expectedVersion: 1 });
      await flushAsync();
    });

    await act(async () => {
      second.reject(new Error("fail b"));
      await flushAsync();
    });
    expect(inHistory().text).toBe("a"); // the first edit is still pending

    await act(async () => {
      first.reject(new Error("fail a"));
      await flushAsync();
    });
    expect(inHistory().text).toBe("original");
    await unmount();
  });

  it("successful higher version stays authoritative when an older overlapping edit fails", async () => {
    const [first, second] = holdCalls(chatsApi.updateMessage as jest.Mock, 2);
    const { result, unmount } = await renderActions();

    await act(async () => {
      result.current.edit.mutate({ messageId: "m1", text: "a", expectedVersion: 1 });
      await flushAsync();
      result.current.edit.mutate({ messageId: "m1", text: "b", expectedVersion: 1 });
      await flushAsync();
    });

    await act(async () => {
      second.resolve(v1({ text: "b", version: 2, editedAt: "2026-01-01T12:01:00.000Z" }));
      await flushAsync();
    });
    await act(async () => {
      first.reject(new Error("409 stale"));
      await flushAsync();
    });

    for (const copy of [inHistory(), inSingle()]) {
      expect(copy).toMatchObject({ text: "b", version: 2 });
    }
    await unmount();
  });

  it("a failed edit keeps a concurrent pending reaction, and vice versa", async () => {
    const [editCall] = holdCalls(chatsApi.updateMessage as jest.Mock, 1);
    const [reactCall] = holdCalls(chatsApi.addReaction as jest.Mock, 1);
    const { result, unmount } = await renderActions();

    await act(async () => {
      result.current.edit.mutate({ messageId: "m1", text: "edited", expectedVersion: 1 });
      await flushAsync();
      result.current.react.mutate({ messageId: "m1", emoji: "👍" });
      await flushAsync();
    });

    await act(async () => {
      editCall.reject(new Error("fail edit"));
      await flushAsync();
    });
    expect(inHistory()).toMatchObject({ text: "original", reactions: [{ userId: me, emoji: "👍" }] });

    await act(async () => {
      reactCall.reject(new Error("fail react"));
      await flushAsync();
    });
    expect(inHistory()).toMatchObject({ text: "original", reactions: [] });
    expect(inSingle()).toMatchObject({ text: "original", reactions: [] });
    await unmount();
  });

  it("an edit that succeeds is not undone by a later-failing reaction started before it", async () => {
    const [reactCall] = holdCalls(chatsApi.addReaction as jest.Mock, 1);
    const [editCall] = holdCalls(chatsApi.updateMessage as jest.Mock, 1);
    const { result, unmount } = await renderActions();

    await act(async () => {
      result.current.react.mutate({ messageId: "m1", emoji: "❤️" });
      await flushAsync();
      result.current.edit.mutate({ messageId: "m1", text: "edited", expectedVersion: 1 });
      await flushAsync();
    });

    await act(async () => {
      editCall.resolve(v1({ text: "edited", version: 2 }));
      await flushAsync();
    });
    await act(async () => {
      reactCall.reject(new Error("fail react"));
      await flushAsync();
    });

    expect(inHistory()).toMatchObject({ text: "edited", version: 2 });
    await unmount();
  });
});
