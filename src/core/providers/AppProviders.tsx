import { clientPersister, queryClient } from "@core/queryClient";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { RealtimeProvider } from "./RealtimeProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
    >
      <RealtimeProvider>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </RealtimeProvider>
    </PersistQueryClientProvider>
  );
}
