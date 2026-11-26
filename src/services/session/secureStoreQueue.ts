/**
 * R9: a single FIFO queue for every native credential/PIN mutation
 * (SecureStore set + delete for tokens and the PIN).
 *
 * Why a queue and not a generation check: once `setItemAsync` has been issued
 * the native write will land; checking the session afterwards only detects
 * that it was stale, it cannot undo it. Ordering is the only real guarantee:
 *
 *   A's write (already running) -> logout's delete -> B's write
 *
 * so whatever A had in flight is always erased by A's logout, and B's
 * credentials are always written last.
 *
 * Writes pass their initiating session generation; a write still waiting in
 * the queue when its session ends is skipped instead of run. Deletes always
 * run. A failed operation never blocks the ones behind it.
 *
 * Deliberately has no imports so token/pin modules can use it without cycles.
 */
let tail: Promise<unknown> = Promise.resolve();

export function enqueueSecureOp<T>(op: () => Promise<T>): Promise<T> {
  const run = tail.then(op, op);
  tail = run.catch(() => undefined);
  return run;
}

/** Resolves once every operation queued so far has settled. */
export async function whenSecureOpsSettled(): Promise<void> {
  await tail;
}
