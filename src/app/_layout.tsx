import { clientPersister, queryClient } from "@core/queryClient";
import { useThemeStore } from "@store";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import "react-native-gesture-handler";
import "../global.css";

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: clientPersister }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </PersistQueryClientProvider>
  );
}
