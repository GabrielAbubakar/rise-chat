import type { QueryClient } from "@tanstack/react-query";

/**
 * Empties a QueryClient between tests without leaving timers behind.
 *
 * TanStack Query schedules a garbage-collection timer (default gcTime: 5
 * minutes) on every query and mutation, and reschedules it whenever the last
 * observer goes away, e.g. when Testing Library unmounts a `useMutation` hook
 * in its own afterEach, after this reset ran. `MutationCache.clear()` also
 * drops mutations without cancelling their timers. Any of these keep Jest
 * alive for ~5 minutes after the run, which stalls the pre-push hook.
 *
 * So: switch GC off for tests (gcTime: Infinity schedules no timer at all),
 * keeping the client's other defaults, then cancel any timer already running
 * and clear the cache.
 */
export function resetQueryClient(queryClient: QueryClient): void {
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, gcTime: Infinity },
    mutations: { ...defaults.mutations, gcTime: Infinity },
  });
  queryClient
    .getMutationCache()
    .getAll()
    .forEach((mutation) => mutation.destroy());
  queryClient.clear();
}
