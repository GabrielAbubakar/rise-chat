import { tokenStorage } from "@/services/api/token";

/**
 * Thrown when asynchronous work outlives the session that started it
 * (logout, account switch, or a fresh login of the same account).
 *
 * Callers should treat it as "this result no longer belongs to anyone":
 * no cache writes, no rollbacks, no toasts, no navigation.
 */
export class StaleSessionError extends Error {
  readonly initiatingGeneration: number;
  readonly currentGeneration: number;

  constructor(
    message = "Work from a previous session was discarded",
    initiatingGeneration = -1,
    currentGeneration = tokenStorage.getSessionGeneration(),
  ) {
    super(message);
    this.name = "StaleSessionError";
    this.initiatingGeneration = initiatingGeneration;
    this.currentGeneration = currentGeneration;
  }
}

export function isStaleSessionError(error: unknown): error is StaleSessionError {
  return (
    error instanceof StaleSessionError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "StaleSessionError")
  );
}

export function isSessionCurrent(generation: number): boolean {
  return tokenStorage.getSessionGeneration() === generation;
}

/** Throws StaleSessionError if the session has changed since `generation` was captured. */
export function assertSessionCurrent(
  generation: number,
  message?: string,
): void {
  const current = tokenStorage.getSessionGeneration();
  if (current !== generation) {
    throw new StaleSessionError(message, generation, current);
  }
}

/**
 * Runs `work` bound to the session that is current right now. If the session
 * changes before `work` settles, its outcome (success OR failure) is replaced
 * with a StaleSessionError so no consumer acts on it.
 */
export async function runInSession<T>(work: () => Promise<T> | T): Promise<T> {
  const generation = tokenStorage.getSessionGeneration();
  let result: T;
  try {
    result = await work();
  } catch (error) {
    assertSessionCurrent(generation);
    throw error;
  }
  assertSessionCurrent(generation);
  return result;
}
