import { useColorScheme } from "nativewind";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, typography } from "@shared/constants";
import { ThemePreference, useThemeStore } from "@store/useThemeStore";

export default function Index() {
  const { colorScheme } = useColorScheme();
  const { themePreference, setThemePreference } = useThemeStore();
  const isNightMode = colorScheme === "dark";

  return (
    <ScrollView className="flex-1 p-6 bg-app dark:bg-neutral-900">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-h2 mb-1 text-label dark:text-label-dark">
          Chatme UI Kit
        </Text>
        <Text className="text-body-sm text-neutral-500 dark:text-neutral-300">
          {isNightMode ? "Night Mode Active 🌙" : "Day Mode Active ☀️"}
        </Text>
      </View>

      {/* Theme Settings */}
      <View className="mb-6 p-1 rounded-2xl flex-row border bg-surface dark:bg-neutral-700 border-divider dark:border-neutral-600">
        {(["system", "light", "dark"] as ThemePreference[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setThemePreference(mode)}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${
              themePreference === mode
                ? "bg-app dark:bg-neutral-600 border border-divider dark:border-transparent"
                : "border border-transparent"
            }`}
          >
            <Text
              className={`text-body-sm font-semibold capitalize ${
                themePreference === mode
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {mode}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Surface Preview Card */}
      <View className="mb-6 p-5 rounded-2xl border bg-surface dark:bg-neutral-700 border-divider dark:border-neutral-600">
        <Text className="text-h3 mb-2 text-label dark:text-label-dark">
          Active Surface Theme
        </Text>
        <Text className="text-body-md mb-4 text-neutral-500 dark:text-neutral-300">
          This container dynamically adapts between Day (#FFFFFF) and Night
          (#163043) mode.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-primary-400 p-3 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-body-sm">
              Primary Brand
            </Text>
            <Text className="text-white text-[10px] opacity-90">
              {colors.primary[400]}
            </Text>
          </View>
          <View className="flex-1 bg-neutral-900 p-3 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-body-sm">
              Neutral 900
            </Text>
            <Text className="text-white text-[10px] opacity-90">
              {colors.neutral[900]}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Palette */}
      <View className="mb-6 p-4 rounded-xl border bg-surface dark:bg-neutral-700 border-divider dark:border-neutral-600">
        <Text className="text-h4 mb-3 text-neutral-900 dark:text-white">
          Primary Green Tokens
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            {
              shade: "50",
              hex: colors.primary[50],
              bg: "bg-primary-50",
              text: "text-neutral-900",
            },
            {
              shade: "200",
              hex: colors.primary[200],
              bg: "bg-primary-200",
              text: "text-neutral-900",
            },
            {
              shade: "400",
              hex: colors.primary[400],
              bg: "bg-primary-400",
              text: "text-white",
            },
          ].map((item) => (
            <View
              key={item.shade}
              className={`w-[95px] h-16 ${item.bg} p-2 rounded-lg justify-between`}
            >
              <Text className={`font-bold text-body-sm ${item.text}`}>
                {item.shade}
              </Text>
              <Text className={`text-[10px] ${item.text}`}>{item.hex}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Neutral Palette */}
      <View className="mb-6 p-4 rounded-xl border bg-surface dark:bg-neutral-700 border-divider dark:border-neutral-600">
        <Text className="text-h4 mb-3 text-neutral-900 dark:text-white">
          Neutral Tokens
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            {
              shade: "50",
              hex: colors.neutral[50],
              bg: "bg-neutral-50",
              text: "text-neutral-900",
            },
            {
              shade: "300",
              hex: colors.neutral[300],
              bg: "bg-neutral-300",
              text: "text-white",
            },
            {
              shade: "500",
              hex: colors.neutral[500],
              bg: "bg-neutral-500",
              text: "text-white",
            },
            {
              shade: "600",
              hex: colors.neutral[600],
              bg: "bg-neutral-600",
              text: "text-white",
            },
            {
              shade: "700",
              hex: colors.neutral[700],
              bg: "bg-neutral-700",
              text: "text-white",
            },
            {
              shade: "900",
              hex: colors.neutral[900],
              bg: "bg-neutral-900",
              text: "text-white",
            },
          ].map((item) => (
            <View
              key={item.shade}
              className={`w-[90px] h-16 ${item.bg} p-2 rounded-lg justify-between`}
            >
              <Text className={`font-bold text-body-sm ${item.text}`}>
                {item.shade}
              </Text>
              <Text className={`text-[10px] ${item.text}`}>{item.hex}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Typography Tokens */}
      <View className="mb-12 p-4 rounded-xl border bg-surface dark:bg-neutral-700 border-divider dark:border-neutral-600">
        <Text className="text-h4 mb-3 text-neutral-900 dark:text-white">
          Typography Spec
        </Text>
        <View className="gap-2">
          <Text className="text-h1 text-neutral-900 dark:text-white">
            Heading 1 ({typography.heading.h1.size}px /{" "}
            {typography.heading.h1.weight})
          </Text>
          <Text className="text-h2 text-neutral-900 dark:text-white">
            Heading 2 ({typography.heading.h2.size}px /{" "}
            {typography.heading.h2.weight})
          </Text>
          <Text className="text-body-lg font-semibold text-neutral-500 dark:text-neutral-300">
            Body Large Semibold ({typography.body.lg.size}px)
          </Text>
          <Text className="text-body-md font-medium text-neutral-500 dark:text-neutral-300">
            Body Medium Medium ({typography.body.md.size}px)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
