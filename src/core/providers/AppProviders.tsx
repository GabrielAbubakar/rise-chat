import { clientPersister, queryClient } from "@core/queryClient";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
    >
      <GestureHandlerRootView>
        <KeyboardProvider>{children}</KeyboardProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
