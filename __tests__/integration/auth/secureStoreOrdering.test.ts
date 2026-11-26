/**
 * R9 — Serialize in-flight credential and PIN writes with logout and later sessions.
 *
 * A native write that was already issued before logout must not land after
 * logout's delete or after a newer session's write. Every case checks live
 * memory AND a fresh process/module reading the persisted storage.
 */
import { tokenStorage } from "@/services/api/token";
import { savePinCode, verifyPinCode } from "@/services/security/pin";
import { useAuthStore } from "@/store/useAuthStore";
import { flushAsync } from "../../../test-utils/deferred";
import {
  SECURE_KEYS,
  secureStoreMock,
  secureStoreModule,
} from "../../../test-utils/secureStoreMock";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);

const PURGE_KEY = "credential_purge_pending";

/**
 * Simulates a cold start: a fresh module graph whose SecureStore and MMKV hold
 * exactly what this process left on "disk", then reads the access token the
 * way the app does on launch.
 */
async function coldStartAccessToken(): Promise<string | null> {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const disk = new Map(secureStoreMock.data);
  const purgePending = require("react-native-mmkv").createMMKV().getBoolean(PURGE_KEY);
  let freshTokenStorage!: typeof tokenStorage;
  jest.isolateModules(() => {
    const store = require("../../../test-utils/secureStoreMock");
    store.secureStoreMock.reset();
    disk.forEach((value, key) => store.secureStoreMock.data.set(key, value));
    if (purgePending) require("react-native-mmkv").createMMKV().set(PURGE_KEY, true);
    freshTokenStorage = require("@/services/api/token").tokenStorage;
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  await freshTokenStorage.init();
  return freshTokenStorage.getAccessToken();
}

async function logout() {
  return useAuthStore.getState().logout();
}

beforeEach(async () => {
  secureStoreMock.reset();
  await logout(); // clean slate: no session, empty disk
  secureStoreMock.reset();
  jest.clearAllMocks();
});

afterEach(async () => {
  secureStoreMock.reset(); // release anything still held
  await flushAsync();
});

describe("R9: native credential writes are ordered with logout", () => {
  it("A's in-flight token write cannot land after logout + B's login", async () => {
    const heldAccess = secureStoreMock.hold("set", SECURE_KEYS.access);
    const aWrite = tokenStorage.setTokens("A-access", "A-refresh");
    await flushAsync(); // A's native write is now issued and in flight

    const aLogout = logout();
    const bLogin = tokenStorage.setTokens("B-access", "B-refresh");

    // Let B's login run as far as it can before A's old write lands
    await flushAsync();
    heldAccess.resolve();
    await Promise.all([aWrite, aLogout, bLogin]);

    expect(await tokenStorage.getAccessToken()).toBe("B-access");
    expect(secureStoreMock.data.get(SECURE_KEYS.access)).toBe("B-access");
    expect(secureStoreMock.data.get(SECURE_KEYS.refresh)).toBe("B-refresh");
    expect(await coldStartAccessToken()).toBe("B-access");
  });

  it("A's in-flight refresh-token write cannot land after logout + B's login", async () => {
    await tokenStorage.setTokens("A-access", "A-refresh");
    // A token refresh rotates both tokens; the refresh-key write is held
    const heldRefresh = secureStoreMock.hold("set", SECURE_KEYS.refresh);
    const rotation = tokenStorage.setTokens("A-access-2", "A-refresh-2");
    await flushAsync();

    const aLogout = logout();
    const bLogin = tokenStorage.setTokens("B-access", "B-refresh");
    // Let B's login run as far as it can before A's old write lands
    await flushAsync();
    heldRefresh.resolve();
    await Promise.all([rotation, aLogout, bLogin]);

    expect(secureStoreMock.data.get(SECURE_KEYS.refresh)).toBe("B-refresh");
    expect(await tokenStorage.getRefreshToken()).toBe("B-refresh");
    expect(await coldStartAccessToken()).toBe("B-access");
  });

  it("with no new login, A's late write is erased and a cold start has no credentials", async () => {
    const heldAccess = secureStoreMock.hold("set", SECURE_KEYS.access);
    const aWrite = tokenStorage.setTokens("A-access", "A-refresh");
    await flushAsync();

    const aLogout = logout();
    heldAccess.resolve();
    await Promise.all([aWrite, aLogout]);

    expect(secureStoreMock.data.has(SECURE_KEYS.access)).toBe(false);
    expect(secureStoreMock.data.has(SECURE_KEYS.refresh)).toBe(false);
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await coldStartAccessToken()).toBeNull();
  });

  it("overlapping logouts while A's write is in flight still end with only B's credentials", async () => {
    const heldAccess = secureStoreMock.hold("set", SECURE_KEYS.access);
    const aWrite = tokenStorage.setTokens("A-access", "A-refresh");
    await flushAsync();

    const first = logout();
    const second = logout();
    const bLogin = tokenStorage.setTokens("B-access", "B-refresh");
    // Let B's login run as far as it can before A's old write lands
    await flushAsync();
    heldAccess.resolve();
    await Promise.all([aWrite, first, second, bLogin]);

    expect(await coldStartAccessToken()).toBe("B-access");
  });

  it("a rejected write does not block later operations or reopen old credentials", async () => {
    secureStoreMock.failNext("set", SECURE_KEYS.access);
    await tokenStorage.setTokens("A-access", "A-refresh"); // native write fails (logged)

    await logout();
    await tokenStorage.setTokens("B-access", "B-refresh");

    expect(secureStoreMock.data.get(SECURE_KEYS.access)).toBe("B-access");
    expect(await coldStartAccessToken()).toBe("B-access");
  });

  it("a write still queued (not started) when its session ends is skipped", async () => {
    // A slow earlier op keeps A's write waiting in the queue
    const heldPin = secureStoreMock.hold("set", SECURE_KEYS.pin);
    const pinSave = savePinCode("A-pin");
    const queuedWrite = tokenStorage.setTokens("A-access", "A-refresh");
    await flushAsync();

    const aLogout = logout();
    heldPin.resolve();
    await Promise.all([pinSave, queuedWrite, aLogout]);

    // The skipped write never reached native storage at all
    expect(secureStoreModule.setItemAsync).not.toHaveBeenCalledWith(
      SECURE_KEYS.access,
      "A-access",
    );
    expect(secureStoreMock.data.has(SECURE_KEYS.access)).toBe(false);
    expect(await coldStartAccessToken()).toBeNull();
  });

  it("control: A's write finishing before logout leaves B's token after B logs in", async () => {
    await tokenStorage.setTokens("A-access", "A-refresh");
    await logout();
    await tokenStorage.setTokens("B-access", "B-refresh");

    expect(await coldStartAccessToken()).toBe("B-access");
  });
});

describe("R9: PIN writes are ordered with logout", () => {
  it("A's in-flight PIN write cannot overwrite B's PIN", async () => {
    const heldPin = secureStoreMock.hold("set", SECURE_KEYS.pin);
    const aSave = savePinCode("1111");
    await flushAsync();

    const aLogout = logout();
    const bSave = savePinCode("2222");
    // Let B's PIN setup run as far as it can before A's old write lands
    await flushAsync();
    heldPin.resolve();
    const [aResult, , bResult] = await Promise.all([aSave, aLogout, bSave]);

    expect(aResult).toBe(false);
    expect(bResult).toBe(true);
    expect(secureStoreMock.data.get(SECURE_KEYS.pin)).toBe("2222");
    expect(await verifyPinCode("2222")).toBe(true);
    expect(await verifyPinCode("1111")).toBe(false);
  });

  it("a rejected PIN write does not block B's PIN save", async () => {
    secureStoreMock.failNext("set", SECURE_KEYS.pin);
    await expect(savePinCode("1111")).rejects.toThrow();

    await logout();
    await expect(savePinCode("2222")).resolves.toBe(true);
    expect(await verifyPinCode("2222")).toBe(true);
  });
});
