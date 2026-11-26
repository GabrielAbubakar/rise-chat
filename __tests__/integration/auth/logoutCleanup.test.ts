/**
 * R6 — End private local presentation before awaiting native cleanup.
 *
 * Holds or rejects SecureStore deletes during logout and checks that private
 * state is detached synchronously, failures are reported without aborting
 * logout, and a newer session is not affected by the old session's cleanup.
 */
import { queryClient } from "@/core/queryClient";
import { useChatDraftsStore } from "@/features/chats/store/useChatDraftsStore";
import { useChatOutboxStore } from "@/features/chats/store/useChatOutboxStore";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { tokenStorage } from "@/services/api/token";
import { savePinCode } from "@/services/security/pin";
import { useAuthStore } from "@/store/useAuthStore";
import { useSecurityStore } from "@/store/useSecurityStore";
import { flushAsync } from "../../../test-utils/deferred";
import { SECURE_KEYS, secureStoreMock } from "../../../test-utils/secureStoreMock";
import { resetQueryClient } from "../../../test-utils/queryClient";

jest.mock("expo-secure-store", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../test-utils/secureStoreMock").secureStoreModule,
);

async function loginAs(id: string) {
  await tokenStorage.setTokens(`${id}-access`, `${id}-refresh`);
  await savePinCode(`${id}-pin`);
  useAuthStore.setState({ isAuthenticated: true });
  useSecurityStore.setState({ isPinSet: true, isAppUnlocked: true });
  queryClient.setQueryData(profileKeys.me(), { id, displayName: id });
  useChatDraftsStore.getState().setDraft(id, "conv-1", `${id} draft`, null);
  useChatOutboxStore.getState().addOutboxEntry({
    clientMessageId: `${id}-msg`,
    ownerId: id,
    conversationId: "conv-1",
    text: `${id} pending`,
    status: "pending",
    createdAt: new Date(0).toISOString(),
  });
}

function expectSignedOutPresentation() {
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useSecurityStore.getState().isAppUnlocked).toBe(false);
  expect(useSecurityStore.getState().isPinSet).toBe(false);
  expect(queryClient.getQueryData(profileKeys.me())).toBeUndefined();
  expect(useChatDraftsStore.getState().getDraft("A", "conv-1")).toBeUndefined();
  expect(useChatOutboxStore.getState().getAllOutboxEntries("A")).toHaveLength(0);
}

beforeEach(async () => {
  jest.clearAllMocks();
  secureStoreMock.reset();
  resetQueryClient(queryClient);
  await loginAs("A");
});

afterEach(async () => {
  secureStoreMock.reset(); // releases anything still held
  await flushAsync();
  resetQueryClient(queryClient);
});

describe("R6: logout ordering and cleanup failures", () => {
  it("detaches private state synchronously while PIN deletion is held", async () => {
    const heldPinDelete = secureStoreMock.hold("delete", SECURE_KEYS.pin);

    const logoutDone = useAuthStore.getState().logout();

    // No await: everything private is already gone
    expectSignedOutPresentation();
    expect(await tokenStorage.getAccessToken()).toBeNull();

    heldPinDelete.resolve();
    await expect(logoutDone).resolves.toEqual({ failedSteps: [] });
    expect(secureStoreMock.data.has(SECURE_KEYS.pin)).toBe(false);
  });

  it("completes logout and reports the failure when PIN deletion rejects", async () => {
    secureStoreMock.failNext("delete", SECURE_KEYS.pin);

    const result = await useAuthStore.getState().logout();

    expect(result.failedSteps).toEqual(["pin"]);
    expectSignedOutPresentation();
    // The other cleanup steps still ran
    expect(secureStoreMock.data.has(SECURE_KEYS.access)).toBe(false);
    expect(secureStoreMock.data.has(SECURE_KEYS.refresh)).toBe(false);
  });

  it("never serves the old account's persisted token when credential deletion rejects", async () => {
    secureStoreMock.failNext("delete", SECURE_KEYS.access);

    const result = await useAuthStore.getState().logout();

    expect(result.failedSteps).toEqual(["credentials"]);
    expectSignedOutPresentation();
    // A's token is still on disk, but the purge marker blocks cold reads of it
    expect(secureStoreMock.data.get(SECURE_KEYS.access)).toBe("A-access");
    expect(await tokenStorage.getAccessToken()).toBeNull();
  });

  it("A's late cleanup does not erase or sign out B's newer session", async () => {
    const heldAccess = secureStoreMock.hold("delete", SECURE_KEYS.access);
    const heldRefresh = secureStoreMock.hold("delete", SECURE_KEYS.refresh);
    const heldPin = secureStoreMock.hold("delete", SECURE_KEYS.pin);

    const aLogout = useAuthStore.getState().logout();
    expectSignedOutPresentation();

    // B signs in and sets a PIN while A's deletes are still pending
    const bLogin = loginAs("B");
    await flushAsync();

    // A's deletes complete late
    heldAccess.resolve();
    heldRefresh.resolve();
    heldPin.resolve();
    await aLogout;
    await bLogin;

    // B's persisted credentials and PIN survived (written after A's deletes)
    expect(secureStoreMock.data.get(SECURE_KEYS.access)).toBe("B-access");
    expect(secureStoreMock.data.get(SECURE_KEYS.refresh)).toBe("B-refresh");
    expect(secureStoreMock.data.get(SECURE_KEYS.pin)).toBe("B-pin");

    // B's live session is untouched
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(await tokenStorage.getAccessToken()).toBe("B-access");
    expect(queryClient.getQueryData(profileKeys.me())).toEqual({ id: "B", displayName: "B" });
    expect(useChatDraftsStore.getState().getDraft("B", "conv-1")?.text).toBe("B draft");
    expect(useChatOutboxStore.getState().getAllOutboxEntries("B")).toHaveLength(1);
    expect(useChatOutboxStore.getState().getAllOutboxEntries("A")).toHaveLength(0);
  });

  it("does not persist a PIN for a session that ended while the save was waiting", async () => {
    const heldPin = secureStoreMock.hold("delete", SECURE_KEYS.pin);
    const firstLogout = useAuthStore.getState().logout();

    // B signs in; both writes wait behind A's held PIN delete
    const bTokens = tokenStorage.setTokens("B-access", "B-refresh");
    const bPinSave = savePinCode("B-pin");

    // B logs out before the barrier releases
    const secondLogout = useAuthStore.getState().logout();
    heldPin.resolve();
    await Promise.all([firstLogout, secondLogout, bTokens]);

    await expect(bPinSave).resolves.toBe(false);
    expect(secureStoreMock.data.has(SECURE_KEYS.pin)).toBe(false);
  });
});
