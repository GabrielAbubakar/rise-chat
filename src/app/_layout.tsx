import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import "react-native-gesture-handler";
import "../global.css";
import { useThemeStore } from "../store/useThemeStore";

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    console.log("isDark", isDark);
  }, [isDark]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
