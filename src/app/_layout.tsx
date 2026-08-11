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
    "SfPro-Ultralight": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYULTRALIGHT.OTF"),
    "SfPro-Light": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYLIGHT.OTF"),
    "SfPro-Regular": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYREGULAR.OTF"),
    "SfPro-Medium": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYMEDIUM.OTF"),
    "SfPro-Semibold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYSEMIBOLD.OTF"),
    "SfPro-Bold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYBOLD.OTF"),
    "SfPro-Heavy": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYHEAVY.OTF"),
    "SfPro-Ultrabold": require("../../assets/fonts/sf-pro-display/SFPRODISPLAYULTRABOLD.OTF"),
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
