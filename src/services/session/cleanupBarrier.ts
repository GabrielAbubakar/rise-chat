/**
 * Orders native credential writes after any in-flight logout cleanup.
 *
 * Logout clears in-memory state synchronously, then deletes persisted
 * credentials asynchronously. Without a barrier, user A's slow SecureStore
 * delete could land AFTER user B's login wrote new tokens/PIN, wiping B's
 * persisted session. Writers await `waitForSessionCleanup()` first.
 *
 * Deliberately has no imports so token/pin modules can depend on it without cycles.
 */
let pendingCleanup: Promise<unknown> = Promise.resolve();

export function trackSessionCleanup<T>(work: Promise<T>): Promise<T> {
  pendingCleanup = Promise.allSettled([pendingCleanup, work]);
  return work;
}

export async function waitForSessionCleanup(): Promise<void> {
  await pendingCleanup;
}
