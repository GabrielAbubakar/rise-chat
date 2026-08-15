import { AppProviders } from "@core/providers";
import { useAppReady } from "@shared/hooks";
import { useThemeStore } from "@store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import "react-native-gesture-handler";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const isDark = colorScheme === "dark";
  const isAppReady = useAppReady();

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference]);

  if (!isAppReady) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
