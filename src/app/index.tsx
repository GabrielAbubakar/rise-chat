import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, themeModes, typography } from "../tokens";

export default function Index() {
  const [isNightMode, setIsNightMode] = useState(false);
  const currentTheme = isNightMode ? themeModes.night : themeModes.day;

  return (
    <ScrollView className={`flex-1 p-6 ${isNightMode ? 'dark bg-neutral-900' : 'bg-app'}`}>
      {/* Header & Day/Night Toggle */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className={`text-h2 ${isNightMode ? 'text-label-dark' : 'text-label'}`}>
            Chatme UI Kit
          </Text>
          <Text className={`text-body-sm ${isNightMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
            {isNightMode ? 'Night Mode Active 🌙' : 'Day Mode Active ☀️'}
          </Text>
        </View>
        <Pressable
          onPress={() => setIsNightMode(!isNightMode)}
          className={`px-4 py-2 rounded-full border ${isNightMode
            ? 'bg-neutral-700 border-neutral-600'
            : 'bg-surface border-divider shadow-sm'
            }`}
        >
          <Text className={`font-semibold text-body-sm ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
            {isNightMode ? 'Switch to Day ☀️' : 'Switch to Night 🌙'}
          </Text>
        </Pressable>
      </View>

      {/* Surface Preview Card */}
      <View className={`mb-6 p-5 rounded-2xl border ${isNightMode ? 'bg-neutral-700 border-neutral-600' : 'bg-surface border-divider shadow-sm'
        }`}>
        <Text className={`text-h3 mb-2 ${isNightMode ? 'text-label-dark' : 'text-label'}`}>
          Active Surface Theme
        </Text>
        <Text className={`text-body-md mb-4 ${isNightMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
          This container dynamically adapts between Day (#FFFFFF) and Night (#163043) mode.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-primary-400 p-3 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-body-sm">Primary Brand</Text>
            <Text className="text-white text-[10px] opacity-90">{colors.primary[400]}</Text>
          </View>
          <View className="flex-1 bg-neutral-900 p-3 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-body-sm">Neutral 900</Text>
            <Text className="text-white text-[10px] opacity-90">{colors.neutral[900]}</Text>
          </View>
        </View>
      </View>

      {/* Primary Palette */}
      <View className={`mb-6 p-4 rounded-xl border ${isNightMode ? 'bg-neutral-700 border-neutral-600' : 'bg-surface border-divider'
        }`}>
        <Text className={`text-h4 mb-3 ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
          Primary Green Tokens
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            { shade: '50', hex: colors.primary[50], bg: 'bg-primary-50', text: 'text-neutral-900' },
            { shade: '200', hex: colors.primary[200], bg: 'bg-primary-200', text: 'text-neutral-900' },
            { shade: '400', hex: colors.primary[400], bg: 'bg-primary-400', text: 'text-white' },
          ].map((item) => (
            <View key={item.shade} className={`w-[95px] h-16 ${item.bg} p-2 rounded-lg justify-between shadow-sm`}>
              <Text className={`font-bold text-body-sm ${item.text}`}>{item.shade}</Text>
              <Text className={`text-[10px] ${item.text}`}>{item.hex}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Neutral Palette */}
      <View className={`mb-6 p-4 rounded-xl border ${isNightMode ? 'bg-neutral-700 border-neutral-600' : 'bg-surface border-divider'
        }`}>
        <Text className={`text-h4 mb-3 ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
          Neutral Tokens
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            { shade: '50', hex: colors.neutral[50], bg: 'bg-neutral-50', text: 'text-neutral-900' },
            { shade: '300', hex: colors.neutral[300], bg: 'bg-neutral-300', text: 'text-white' },
            { shade: '500', hex: colors.neutral[500], bg: 'bg-neutral-500', text: 'text-white' },
            { shade: '600', hex: colors.neutral[600], bg: 'bg-neutral-600', text: 'text-white' },
            { shade: '700', hex: colors.neutral[700], bg: 'bg-neutral-700', text: 'text-white' },
            { shade: '900', hex: colors.neutral[900], bg: 'bg-neutral-900', text: 'text-white' },
          ].map((item) => (
            <View key={item.shade} className={`w-[90px] h-16 ${item.bg} p-2 rounded-lg justify-between shadow-sm`}>
              <Text className={`font-bold text-body-sm ${item.text}`}>{item.shade}</Text>
              <Text className={`text-[10px] ${item.text}`}>{item.hex}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Typography Tokens */}
      <View className={`mb-12 p-4 rounded-xl border ${isNightMode ? 'bg-neutral-700 border-neutral-600' : 'bg-surface border-divider'
        }`}>
        <Text className={`text-h4 mb-3 ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
          Typography Spec
        </Text>
        <View className="gap-2">
          <Text className={`text-h1 ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
            Heading 1 ({typography.heading.h1.size}px / {typography.heading.h1.weight})
          </Text>
          <Text className={`text-h2 ${isNightMode ? 'text-white' : 'text-neutral-900'}`}>
            Heading 2 ({typography.heading.h2.size}px / {typography.heading.h2.weight})
          </Text>
          <Text className={`text-body-lg font-semibold ${isNightMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
            Body Large Semibold ({typography.body.lg.size}px)
          </Text>
          <Text className={`text-body-md font-medium ${isNightMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
            Body Medium Medium ({typography.body.md.size}px)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
