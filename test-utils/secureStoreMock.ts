import { deferred, Deferred } from "./deferred";

/**
 * In-memory expo-secure-store with controllable timing.
 *
 *   secureStoreMock.hold("get", key)    -> next read of key waits until released
 *   secureStoreMock.failNext("delete", key) -> next delete of key rejects
 *
 * Reads snapshot the value when called (like a native read already in flight);
 * writes and deletes apply when released, so a held delete can land after a
 * later write — exactly the ordering bug the cleanup barrier must prevent.
 *
 * Use from a test with:
 *   jest.mock("expo-secure-store", () =>
 *     require("<relative>/test-utils/secureStoreMock").secureStoreModule);
 */
type Op = "get" | "set" | "delete";

const data = new Map<string, string>();
const holds = new Map<string, Deferred<void>>();
const failures = new Map<string, Error>();

const id = (op: Op, key: string) => `${op}:${key}`;

async function gate(op: Op, key: string): Promise<void> {
  const hold = holds.get(id(op, key));
  if (hold) {
    holds.delete(id(op, key));
    await hold.promise;
  }
  const failure = failures.get(id(op, key));
  if (failure) {
    failures.delete(id(op, key));
    throw failure;
  }
}

export const secureStoreMock = {
  data,
  hold(op: Op, key: string): Deferred<void> {
    const d = deferred<void>();
    holds.set(id(op, key), d);
    return d;
  },
  failNext(op: Op, key: string, error = new Error(`SecureStore ${op} failed`)) {
    failures.set(id(op, key), error);
  },
  reset() {
    data.clear();
    holds.forEach((d) => d.resolve());
    holds.clear();
    failures.clear();
  },
};

export const secureStoreModule = {
  getItemAsync: jest.fn(async (key: string) => {
    const snapshot = data.get(key) ?? null;
    await gate("get", key);
    return snapshot;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    await gate("set", key);
    data.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    await gate("delete", key);
    data.delete(key);
  }),
};

export const SECURE_KEYS = {
  access: "rise_chat_access_token",
  refresh: "rise_chat_refresh_token",
  pin: "user_pin_code",
} as const;
