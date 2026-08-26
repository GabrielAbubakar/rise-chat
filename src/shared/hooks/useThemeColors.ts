import { useColorScheme } from "nativewind";
import { colors } from "@/shared/constants/tokens";

const ThemeColors = {
  light: {
    appBackground: colors.app.DEFAULT,
    bottomSheetIndicator: colors.neutral[50], // DDE2E8
    // add more shared tokens here as needed, pointing directly to the tokens file
  },
  dark: {
    appBackground: colors.app.dark,
    bottomSheetIndicator: colors.neutral[500], // 3A566A
    // add more shared tokens here as needed, pointing directly to the tokens file
  },
};

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return ThemeColors[isDark ? "dark" : "light"];
}
