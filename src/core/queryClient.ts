import { createZustandStorage } from "@store/storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, type AppStateStatus, Platform } from "react-native";

const mmkvPersister = createZustandStorage("react-query-cache");

// Connect React Native AppState to TanStack Query's focus manager
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status: AppStateStatus) => {
    focusManager.setFocused(status === "active");
  });
}

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

