import { AppProviders } from "@core/providers";
import { useThemeStore } from "@store";
import { useFonts } from "expo-font";
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

  const [loaded, error] = useFonts({
    "SfPro-Ultralight": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYULTRALIGHTITALIC.otf"),
    "SfPro-Light": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYLIGHTITALIC.otf"),
    "SfPro-Regular": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYREGULAR.otf"),
    "SfPro-Medium": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYMEDIUM.otf"),
    "SfPro-Semibold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYSEMIBOLDITALIC.otf"),
    "SfPro-Bold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYBOLD.otf"),
    "SfPro-Heavy": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYHEAVYITALIC.otf"),
    "SfPro-Ultrabold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYBLACKITALIC.otf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
