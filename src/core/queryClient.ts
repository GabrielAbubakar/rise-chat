import { createZustandStorage } from "@store/storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

const mmkvPersister = createZustandStorage("react-query-cache");

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 2, // Data is fresh for 2 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
    },
  },
});

export const clientPersister = createAsyncStoragePersister({
  storage: mmkvPersister,
});
