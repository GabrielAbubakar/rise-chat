/**
 * R5 — Recheck session ownership after asynchronous token lookup.
 *
 * Uses the real Axios client and interceptors with a controlled transport
 * adapter, and a controllable SecureStore so the cold token read can be held
 * open across logout + login as another account.
 */
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);

type Modules = {
  apiClient: typeof import("@/services/api/client").apiClient;
  tokenStorage: typeof import("@/services/api/token").tokenStorage;
  useAuthStore: typeof import("@/store/useAuthStore").useAuthStore;
  store: typeof import("../../../test-utils/secureStoreMock");
  helpers: typeof import("../../../test-utils/deferred");
};

/** Fresh module graph = cold start: empty in-memory token cache. */
function coldStart(persisted: { access: string; refresh: string }): Modules {
  jest.resetModules();
  /* eslint-disable @typescript-eslint/no-require-imports */
  const store = require("../../../test-utils/secureStoreMock");
  store.secureStoreMock.reset();
  store.secureStoreMock.data.set(store.SECURE_KEYS.access, persisted.access);
  store.secureStoreMock.data.set(store.SECURE_KEYS.refresh, persisted.refresh);
  return {
    apiClient: require("@/services/api/client").apiClient,
    tokenStorage: require("@/services/api/token").tokenStorage,
    useAuthStore: require("@/store/useAuthStore").useAuthStore,
    store,
    helpers: require("../../../test-utils/deferred"),
  };
  /* eslint-enable @typescript-eslint/no-require-imports */
}

function recordingAdapter() {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
  return { adapter, sent };
}

describe("R5: request dispatch ownership", () => {
  it("does not dispatch A's request when its cold token read finishes after logout + login as B", async () => {
    const m = coldStart({ access: "A-access", refresh: "A-refresh" });
    m.useAuthStore.setState({ isAuthenticated: true });
    const { adapter, sent } = recordingAdapter();

    // A's POST starts; the cold SecureStore read of A's token is held open
    const heldRead = m.store.secureStoreMock.hold("get", m.store.SECURE_KEYS.access);
    const aRequest = m.apiClient.post("/messages", { text: "from A" }, { adapter });
    aRequest.catch(() => {}); // asserted below
    await m.helpers.flushAsync();
    expect(sent).toHaveLength(0);

    // A logs out, B logs in
    await m.useAuthStore.getState().logout();
    await m.tokenStorage.setTokens("B-access", "B-refresh");
    m.useAuthStore.setState({ isAuthenticated: true });

    // The old read completes
    heldRead.resolve();

    await expect(aRequest).rejects.toMatchObject({ name: "StaleSessionError" });
    expect(sent).toHaveLength(0);

    // The late read did not overwrite B's in-memory token
    expect(await m.tokenStorage.getAccessToken()).toBe("B-access");
  });

  it("does not dispatch A's request across logout + a new login of the same account", async () => {
    const m = coldStart({ access: "A-access", refresh: "A-refresh" });
    const { adapter, sent } = recordingAdapter();

    const heldRead = m.store.secureStoreMock.hold("get", m.store.SECURE_KEYS.access);
    const oldRequest = m.apiClient.post("/messages", { text: "old" }, { adapter });
    oldRequest.catch(() => {});
    await m.helpers.flushAsync();

    await m.useAuthStore.getState().logout();
    await m.tokenStorage.setTokens("A-access-2", "A-refresh-2");
    heldRead.resolve();

    await expect(oldRequest).rejects.toMatchObject({ name: "StaleSessionError" });
    expect(sent).toHaveLength(0);
  });

  it("rejects a replay stamped with an earlier session before dispatch", async () => {
    const m = coldStart({ access: "A-access", refresh: "A-refresh" });
    const { adapter, sent } = recordingAdapter();
    const oldGeneration = m.tokenStorage.getSessionGeneration();

    await m.useAuthStore.getState().logout();
    await m.tokenStorage.setTokens("B-access", "B-refresh");

    // e.g. a request queued during A's refresh and replayed afterwards
    const replay = m.apiClient.request({
      url: "/messages",
      method: "post",
      adapter,
      _sessionGeneration: oldGeneration,
    } as any);

    await expect(replay).rejects.toMatchObject({ name: "StaleSessionError" });
    expect(sent).toHaveLength(0);
  });

  it("discards a response that arrives after the session changed", async () => {
    const m = coldStart({ access: "A-access", refresh: "A-refresh" });
    const heldResponse = m.helpers.deferred<void>();
    const adapter: AxiosAdapter = async (config) => {
      await heldResponse.promise;
      return { data: { id: "A" }, status: 200, statusText: "OK", headers: {}, config };
    };

    const aRequest = m.apiClient.get("/profile/me", { adapter });
    aRequest.catch(() => {});
    await m.helpers.flushAsync();

    await m.useAuthStore.getState().logout();
    await m.tokenStorage.setTokens("B-access", "B-refresh");
    heldResponse.resolve();

    await expect(aRequest).rejects.toMatchObject({ name: "StaleSessionError" });
  });

  it("control: a cold read within the same session dispatches with that session's token", async () => {
    const m = coldStart({ access: "A-access", refresh: "A-refresh" });
    const { adapter, sent } = recordingAdapter();

    const heldRead = m.store.secureStoreMock.hold("get", m.store.SECURE_KEYS.access);
    const request = m.apiClient.post("/messages", { text: "hi" }, { adapter });
    await m.helpers.flushAsync();
    heldRead.resolve();

    await expect(request).resolves.toMatchObject({ status: 200 });
    expect(sent).toHaveLength(1);
    expect(sent[0].headers.Authorization).toBe("Bearer A-access");
  });
});
