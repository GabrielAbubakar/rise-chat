import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { createMMKV } from "react-native-mmkv";

const queryClientStorage = createMMKV({ id: "react-query-cache" });

const mmkvPersister = {
  setItem: (key: string, value: string) => {
    queryClientStorage.set(key, value);
  },
  getItem: (key: string) => {
    return queryClientStorage.getString(key) ?? null;
  },
  removeItem: (key: string) => {
    queryClientStorage.remove(key);
  },
};

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
