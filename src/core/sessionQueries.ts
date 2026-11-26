import { tokenStorage } from "@/services/api/token";
import { assertSessionCurrent } from "@/services/session/staleSession";
import type { CancelOptions, QueryClient, QueryFilters } from "@tanstack/react-query";

const STALE_SETUP = "Optimistic update from a previous session was discarded";

/**
 * R4: `cancelQueries` for optimistic setup. Optimistic `onMutate` callbacks
 * await cancellation and then write to the cache; if logout/login happens
 * during that await, the write would land in a cache that logout already
 * cleared (or in the next account's cache). This throws StaleSessionError
 * instead of returning, so nothing after the await runs.
 *
 * `useSessionMutation`'s check on the final onMutate result cannot do this:
 * by then the write has already happened.
 *
 * Pass `generation` when the setup captured it earlier (before other awaits);
 * otherwise the session current at call time is used.
 */
export async function cancelQueriesInSession(
  queryClient: QueryClient,
  filters: QueryFilters,
  options?: CancelOptions & { generation?: number },
): Promise<void> {
  const generation = options?.generation ?? tokenStorage.getSessionGeneration();
  assertSessionCurrent(generation, STALE_SETUP);
  await queryClient.cancelQueries(filters, options);
  assertSessionCurrent(generation, STALE_SETUP);
}

/** Recheck after any other await inside optimistic setup, before writing. */
export function assertSetupInSession(generation: number): void {
  assertSessionCurrent(generation, STALE_SETUP);
}
