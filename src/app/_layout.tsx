import { AppProviders } from "@core/providers";
import { toastConfig } from "@shared/components";
import { useAppReady, useProtectedRoute } from "@shared/hooks";
import { useThemeStore } from "@store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, vars } from "nativewind";
import { COLOR_SCHEMES } from "../shared/constants/themes";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import Toast from "react-native-toast-message";
// import { ObserveRoot, useObserve } from "expo-observe";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const primaryColor = useThemeStore((state) => state.primaryColor);
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

  const themeVars = vars({
    "--color-primary-50": COLOR_SCHEMES[primaryColor]["50"],
    "--color-primary-100": COLOR_SCHEMES[primaryColor]["100"],
    "--color-primary-200": COLOR_SCHEMES[primaryColor]["200"],
    "--color-primary-300": COLOR_SCHEMES[primaryColor]["300"],
    "--color-primary-400": COLOR_SCHEMES[primaryColor]["400"],
    "--color-primary-DEFAULT": COLOR_SCHEMES[primaryColor].DEFAULT,
  });

  return (
    <View style={[{ flex: 1 }, themeVars as any]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      <Toast config={toastConfig} position="top" topOffset={60} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
