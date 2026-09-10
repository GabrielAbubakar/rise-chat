import { AppProviders } from "@core/providers";
import { toastConfig } from "@shared/components";
import { useAppReady, useProtectedRoute } from "@shared/hooks";
import { useThemeStore } from "@store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import "react-native-gesture-handler";
import Toast from "react-native-toast-message";
// import { ObserveRoot, useObserve } from "expo-observe";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const isDark = colorScheme === "dark";
  const isAppReady = useAppReady();
  // const { markInteractive } = useObserve();

  // Enforce global routing based on authentication state
  useProtectedRoute(isAppReady);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync()
        .then(() => {
          // markInteractive();
        })
        .catch(() => {});
    }
    // }, [isAppReady, markInteractive]);
  }, [isAppReady]);

  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference, setColorScheme]);

  if (!isAppReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      <Toast config={toastConfig} position="top" topOffset={60} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
