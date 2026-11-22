import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";
import { waitForSessionCleanup } from "../session/cleanupBarrier";

const ACCESS_TOKEN_KEY = "rise_chat_access_token";
const REFRESH_TOKEN_KEY = "rise_chat_refresh_token";

// Synchronous marker: set before deleting persisted credentials, cleared once the
// delete (or a newer session's write) succeeds. If a delete fails or the app is
// killed mid-logout, the next launch must not load the old account's tokens.
const PURGE_PENDING_KEY = "credential_purge_pending";
const sessionMMKV = createMMKV({ id: "session-cleanup" });

function isPurgePending(): boolean {
  try {
    return sessionMMKV.getBoolean(PURGE_PENDING_KEY) === true;
  } catch {
    return false;
  }
}

function setPurgePending(pending: boolean): void {
  try {
    if (pending) {
      sessionMMKV.set(PURGE_PENDING_KEY, true);
    } else {
      sessionMMKV.remove(PURGE_PENDING_KEY);
    }
  } catch (e) {
    console.error("Error updating credential purge marker", e);
  }
}

// Synchronous in-memory token cache to prevent async storage race conditions
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let isInitialized = false;
let currentSessionGeneration = 1;
const refreshListeners: Set<(token: string) => void> = new Set();

function notifyRefreshListeners(token: string) {
  refreshListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (e) {
      console.error("Error in token refresh listener", e);
    }
  });
}

async function deletePersistedKeys(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/**
 * Cold read from SecureStore that cannot leak across sessions: if the session
 * changes while the native read is pending, the value is discarded and the
 * in-memory cache (which may now hold the new session's token) is untouched.
 */
async function readPersisted(
  key: string,
  getMemory: () => string | null,
  setMemory: (token: string | null) => void,
): Promise<string | null> {
  const memory = getMemory();
  if (memory !== null) return memory;
  if (isPurgePending()) return null;

  const generation = currentSessionGeneration;
  let token: string | null;
  try {
    token = await SecureStore.getItemAsync(key);
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return null;
  }

  if (generation !== currentSessionGeneration) {
    return getMemory();
  }
  // A concurrent write in the same session wins over the older disk value
  const latest = getMemory();
  if (latest !== null) return latest;
  setMemory(token);
  return token;
}

/**
 * Persists credentials only after any earlier logout cleanup has finished, and
 * only if the session that requested the write is still current.
 */
async function persistInSession(
  generation: number,
  writes: [key: string, value: string][],
): Promise<boolean> {
  await waitForSessionCleanup();
  if (generation !== currentSessionGeneration) return false;
  await Promise.all(
    writes.map(([key, value]) => SecureStore.setItemAsync(key, value)),
  );
  if (generation !== currentSessionGeneration) return false;
  setPurgePending(false);
  return true;
}

export const tokenStorage = {
  // Session generation tracker for invalidating late asynchronous writes
  getSessionGeneration: (): number => currentSessionGeneration,

  incrementSessionGeneration: (): number => {
    currentSessionGeneration += 1;
    return currentSessionGeneration;
  },

  // Subscribe to token rotation (e.g., to synchronize socket connection)
  onTokenRefreshed: (listener: (token: string) => void): (() => void) => {
    refreshListeners.add(listener);
    return () => {
      refreshListeners.delete(listener);
    };
  },

  // Initialize in-memory cache from SecureStore on startup
  init: async (): Promise<void> => {
    if (isInitialized) return;
    try {
      if (isPurgePending()) {
        // A previous logout did not finish deleting credentials: finish it now
        // instead of restoring the old account's tokens.
        await tokenStorage.deletePersistedTokens();
        return;
      }
      const generation = currentSessionGeneration;
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
      if (generation === currentSessionGeneration) {
        memoryAccessToken ??= access;
        memoryRefreshToken ??= refresh;
      }
    } catch (e) {
      console.error("Error initializing tokenStorage", e);
    } finally {
      isInitialized = true;
    }
  },

  getAccessToken: (): Promise<string | null> =>
    readPersisted(
      ACCESS_TOKEN_KEY,
      () => memoryAccessToken,
      (t) => {
        memoryAccessToken = t;
      },
    ),

  getRefreshToken: (): Promise<string | null> =>
    readPersisted(
      REFRESH_TOKEN_KEY,
      () => memoryRefreshToken,
      (t) => {
        memoryRefreshToken = t;
      },
    ),

  setAccessToken: async (token: string): Promise<void> => {
    const generation = currentSessionGeneration;
    memoryAccessToken = token;
    try {
      if (await persistInSession(generation, [[ACCESS_TOKEN_KEY, token]])) {
        notifyRefreshListeners(token);
      }
    } catch (e) {
      console.error("Error setting access token", e);
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    const generation = currentSessionGeneration;
    memoryRefreshToken = token;
    try {
      await persistInSession(generation, [[REFRESH_TOKEN_KEY, token]]);
    } catch (e) {
      console.error("Error setting refresh token", e);
    }
  },

  setTokens: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<void> => {
    const generation = currentSessionGeneration;
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    try {
      const persisted = await persistInSession(generation, [
        [ACCESS_TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken],
      ]);
      if (persisted) {
        console.log("💾 [Auth Module] Tokens saved successfully in memory & secure storage");
        notifyRefreshListeners(accessToken);
      }
    } catch (e) {
      console.error("Error setting tokens", e);
    }
  },

  /**
   * Synchronously ends the current session: bumps the generation (so every
   * in-flight request, mutation and token read from it is discarded) and drops
   * in-memory credentials. Does not touch native storage.
   */
  endSession: (): number => {
    currentSessionGeneration += 1;
    memoryAccessToken = null;
    memoryRefreshToken = null;
    setPurgePending(true);
    return currentSessionGeneration;
  },

  /** Deletes persisted credentials. Rejects on failure so callers can report it. */
  deletePersistedTokens: async (): Promise<void> => {
    setPurgePending(true);
    const generation = currentSessionGeneration;
    await deletePersistedKeys();
    // If a newer session already wrote its own tokens, its write cleared the
    // marker; only clear it here if nothing newer happened.
    if (generation === currentSessionGeneration) {
      setPurgePending(false);
    }
    console.log("🗑️ [Auth Module] Persisted tokens deleted");
  },

  clearTokens: async (): Promise<void> => {
    tokenStorage.endSession();
    try {
      await tokenStorage.deletePersistedTokens();
    } catch (e) {
      console.error("Error clearing tokens", e);
    }
  },
};
