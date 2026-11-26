/**
 * R4 — Discard delayed account-owned mutation callbacks.
 *
 * Real TanStack mutation observers + the production profile hooks, with the
 * profile API held open across logout + login so the response lands in the
 * next session.
 */
import { queryClient } from "@/core/queryClient";
import { useSessionMutation } from "@/core/useSessionMutation";
import { profileApi } from "@/features/settings/api";
import { profileKeys, useUpdateMe } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import Toast from "react-native-toast-message";
import { deferred, flushAsync } from "../../../test-utils/deferred";
import { secureStoreMock } from "../../../test-utils/secureStoreMock";
import { resetQueryClient } from "../../../test-utils/queryClient";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);
jest.mock("@/features/settings/api", () => ({
  profileApi: {
    getMe: jest.fn(() => new Promise(() => {})),
    updateMe: jest.fn(),
    setAvatar: jest.fn(),
    removeAvatar: jest.fn(),
    listBlocks: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
  },
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const updateMe = profileApi.updateMe as jest.Mock;

const profile = (id: string, name: string) => ({ id, displayName: name }) as any;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

async function loginAs(id: string, tokenSuffix = "") {
  await tokenStorage.setTokens(`${id}-access${tokenSuffix}`, `${id}-refresh${tokenSuffix}`);
  useAuthStore.setState({ isAuthenticated: true });
  queryClient.setQueryData(profileKeys.me(), profile(id, `${id} (server)`));
}

async function logout() {
  await useAuthStore.getState().logout();
}

beforeEach(async () => {
  jest.clearAllMocks();
  secureStoreMock.reset();
  resetQueryClient(queryClient);
  await loginAs("A");
});

afterEach(() => {
  resetQueryClient(queryClient);
});

describe("R4: account-owned mutations across session changes", () => {
  it("drops A's delayed profile update success after logout + login as B", async () => {
    const held = deferred<any>();
    updateMe.mockReturnValueOnce(held.promise);
    const hookOnSuccess = jest.fn();
    const callOnSuccess = jest.fn();
    const callOnSettled = jest.fn();

    const { result, unmount } = await renderHook(
      () => useUpdateMe({ onSuccess: hookOnSuccess }),
      { wrapper },
    );

    await act(() => {
      result.current.mutate(
        { displayName: "A renamed" } as any,
        { onSuccess: callOnSuccess, onSettled: callOnSettled },
      );
    });
    await flushAsync();
    expect(updateMe).toHaveBeenCalledTimes(1);

    await logout();
    await loginAs("B");

    await act(async () => {
      held.resolve(profile("A", "A renamed"));
      await flushAsync();
    });

    expect(queryClient.getQueryData(profileKeys.me())).toEqual(profile("B", "B (server)"));
    expect(hookOnSuccess).not.toHaveBeenCalled();
    expect(callOnSuccess).not.toHaveBeenCalled();
    expect(callOnSettled).not.toHaveBeenCalled();
    expect(await tokenStorage.getAccessToken()).toBe("B-access");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await unmount();
  });

  it("drops A's delayed profile update failure: no caller onError, no toast", async () => {
    const held = deferred<any>();
    updateMe.mockReturnValueOnce(held.promise);
    const hookOnError = jest.fn();
    const callOnError = jest.fn();

    const { result, unmount } = await renderHook(
      () => useUpdateMe({ onError: hookOnError }),
      { wrapper },
    );
    await act(() => {
      result.current.mutate({ displayName: "x" } as any, { onError: callOnError });
    });
    await flushAsync();

    await logout();
    await loginAs("B");

    await act(async () => {
      held.reject(new Error("500 from A's request"));
      await flushAsync();
    });

    expect(hookOnError).not.toHaveBeenCalled();
    expect(callOnError).not.toHaveBeenCalled();
    expect(Toast.show).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(profileKeys.me())).toEqual(profile("B", "B (server)"));
    await unmount();
  });

  it("drops A's delayed success across logout + a new session of the same account", async () => {
    const held = deferred<any>();
    updateMe.mockReturnValueOnce(held.promise);

    const { result, unmount } = await renderHook(() => useUpdateMe(), { wrapper });
    let settled: Promise<unknown> = Promise.resolve();
    await act(() => {
      settled = result.current.mutateAsync({ displayName: "old" } as any);
      settled.catch(() => {});
    });
    await flushAsync();

    await logout();
    await loginAs("A", "-2");

    await act(async () => {
      held.resolve(profile("A", "old"));
      await flushAsync();
    });

    await expect(settled).rejects.toMatchObject({ name: "StaleSessionError" });
    expect(queryClient.getQueryData(profileKeys.me())).toEqual(profile("A", "A (server)"));
    await unmount();
  });

  it("does not apply an optimistic rollback from A into B's cache", async () => {
    const held = deferred<void>();
    const { result, unmount } = await renderHook(
      () =>
        useSessionMutation({
          mutationFn: () => held.promise,
          onMutate: () => {
            const previous = queryClient.getQueryData(profileKeys.me());
            queryClient.setQueryData(profileKeys.me(), profile("A", "optimistic"));
            return { previous };
          },
          onError: (_e, _v, ctx) => {
            queryClient.setQueryData(profileKeys.me(), ctx?.previous);
          },
        }),
      { wrapper },
    );

    await act(() => result.current.mutate());
    await flushAsync();

    await logout();
    await loginAs("B");

    await act(async () => {
      held.reject(new Error("failed"));
      await flushAsync();
    });

    expect(queryClient.getQueryData(profileKeys.me())).toEqual(profile("B", "B (server)"));
    await unmount();
  });

  it("never calls mutationFn if the session ends while onMutate is pending", async () => {
    const heldOnMutate = deferred<void>();
    const mutationFn = jest.fn(async () => "done");
    const onSettled = jest.fn();
    const { result, unmount } = await renderHook(
      () =>
        useSessionMutation({
          mutationFn,
          onMutate: () => heldOnMutate.promise,
          onSettled,
        }),
      { wrapper },
    );

    await act(() => result.current.mutate(undefined));
    await flushAsync();
    await logout();
    await loginAs("B");

    await act(async () => {
      heldOnMutate.resolve();
      await flushAsync();
    });

    expect(mutationFn).not.toHaveBeenCalled();
    expect(onSettled).not.toHaveBeenCalled();
    await unmount();
  });

  it("control: a profile update within the same session updates the cache and calls back", async () => {
    updateMe.mockResolvedValueOnce(profile("A", "A renamed"));
    const hookOnSuccess = jest.fn();
    const callOnSuccess = jest.fn();

    const { result, unmount } = await renderHook(
      () => useUpdateMe({ onSuccess: hookOnSuccess }),
      { wrapper },
    );
    await act(async () => {
      result.current.mutate({ displayName: "A renamed" } as any, { onSuccess: callOnSuccess });
      await flushAsync();
    });

    expect(queryClient.getQueryData(profileKeys.me())).toEqual(profile("A", "A renamed"));
    expect(hookOnSuccess).toHaveBeenCalledTimes(1);
    expect(callOnSuccess).toHaveBeenCalledTimes(1);
    await unmount();
  });
});
