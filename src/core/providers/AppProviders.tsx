import { colors } from "@/shared/constants";
import { useThemeStore } from "@/store";
import { clientPersister, queryClient } from "@core/queryClient";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { ReactNode } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { RealtimeProvider } from "./RealtimeProvider";

interface AppProvidersProps {
  children: ReactNode;
}

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.app.dark,
    card: colors.surface.dark,
  },
};
const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.app.DEFAULT,
    card: colors.surface.DEFAULT,
  },
};

export function AppProviders({ children }: AppProvidersProps) {
  const themePreference = useThemeStore((state) => state.themePreference);
  const systemScheme = useRNColorScheme();
  const isDark =
    themePreference === "dark" ||
    (themePreference === "system" && systemScheme === "dark");

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
    >
      <RealtimeProvider>
        <GestureHandlerRootView>
          <ThemeProvider value={isDark ? CustomDarkTheme : CustomDefaultTheme}>
            <KeyboardProvider>
              <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
            </KeyboardProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </RealtimeProvider>
    </PersistQueryClientProvider>
  );
}
