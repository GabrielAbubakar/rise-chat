import { MessagePill } from "@/features/chats/components/MessagePill";
import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useThemeStore } from "@/store";
import { useThemeColors } from "@/shared/hooks";
import { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

// Icons
import LogoIcon from "@/assets/icons/Logo.svg";
import EmojiHappyIcon from "@/assets/icons/outline/emoji-happy.svg";
import MoonIcon from "@/assets/icons/outline/moon.svg";
import CheckCircleIcon from "@/assets/icons/solid/check-circle.svg";

const THEMES = [
  { id: "green", label: "Green", color: "#57B77D" },
  { id: "blue", label: "Blue", color: "#3B82F6" },
  { id: "red", label: "Red", color: "#EF4444" },
  { id: "orange", label: "Orange", color: "#F59E0B" },
];

const ICONS = [
  { id: "green", label: "Green", color: "#57B77D" },
  { id: "blue", label: "Blue", color: "#3B82F6" },
  { id: "red", label: "Red", color: "#EF4444" },
  { id: "orange", label: "Orange", color: "#F59E0B" },
];

export function AppearanceScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const primaryColor = useThemeStore((state) => state.primaryColor);
  const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor);
  const { primary } = useThemeColors();

  const [selectedIcon, setSelectedIcon] = useState("blue");
  const [isNightMode, setIsNightMode] = useState(true);
  const [isLargeEmoji, setIsLargeEmoji] = useState(false);

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        title="Appearance"
        className="pt-10"
        onBack={() => router.back()}
        useSafeArea
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Section with Chat Background */}
        <View className="relative min-h-[250px] pb-8 pt-4">
          <Image
            source={
              isDark
                ? require("@/assets/images/chat-background-dark.png")
                : require("@/assets/images/chat-background-light.png")
            }
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
            style={{ opacity: isDark ? 0.6 : 1 }}
          />

          <View className="mt-8 px-2">
            <MessagePill isMe={false} text="Wie geht es Ihnen?" time="18:25" />
            <MessagePill isMe={true} text="Gut, danke!" time="19:40" />
          </View>
        </View>

        {/* Bottom Settings Section */}
        <View className="px-6 py-6 pb-20">
          {/* Theme Selection */}
          <BaseText className="text-[17px] font-sf-bold text-black dark:text-white mb-4">
            Select a Theme
          </BaseText>
          <View className="flex-row justify-between mb-8">
              {THEMES.map((theme) => {
                const isSelected = primaryColor === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setPrimaryColor(theme.id as any)}
                    activeOpacity={0.8}
                  className={`w-[22%] aspect-[3/4] rounded-2xl overflow-hidden relative bg-neutral-100 dark:bg-[#152433] ${
                    isSelected ? "border-[2px]" : "border-0"
                  }`}
                  style={{
                    borderColor: isSelected ? theme.color : "transparent",
                  }}
                >
                  <View className="flex-1 justify-center px-2 py-3 gap-y-2">
                    <View className="w-8 h-3 rounded-lg rounded-bl-sm bg-white dark:bg-neutral-800 self-start shadow-sm" />
                    <View
                      className="w-10 h-3 rounded-lg rounded-br-sm self-end shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    />
                  </View>
                  <View
                    className="py-1 items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? theme.color : "transparent",
                    }}
                  >
                    <BaseText
                      className="text-xs font-sf-medium"
                      style={{ color: isSelected ? "#fff" : theme.color }}
                    >
                      {theme.label}
                    </BaseText>
                  </View>
                  {isSelected && (
                    <View className="absolute top-1 right-1 bg-white rounded-full">
                      <CheckCircleIcon
                        width={16}
                        height={16}
                        color={theme.color}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toggles */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-neutral-800 items-center justify-center mr-4">
                  <MoonIcon width={20} height={20} color={primary} />
                </View>
                <BaseText className="text-[17px] font-medium text-black dark:text-white">
                  Night Mode
                </BaseText>
              </View>
              <Switch
                value={isNightMode}
                onValueChange={setIsNightMode}
                trackColor={{
                  false: isDark ? "#1A2C3D" : "#E5E7EB",
                  true: primary,
                }}
                thumbColor={Platform.OS === "ios" ? undefined : "#ffffff"}
                ios_backgroundColor={isDark ? "#1A2C3D" : "#E5E7EB"}
              />
            </View>

            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-neutral-800 items-center justify-center mr-4">
                  <EmojiHappyIcon width={20} height={20} color={primary} />
                </View>
                <BaseText className="text-[17px] font-medium text-black dark:text-white">
                  Large Emoji
                </BaseText>
              </View>
              <Switch
                value={isLargeEmoji}
                onValueChange={setIsLargeEmoji}
                trackColor={{
                  false: isDark ? "#1A2C3D" : "#E5E7EB",
                  true: primary,
                }}
                thumbColor={Platform.OS === "ios" ? undefined : "#ffffff"}
                ios_backgroundColor={isDark ? "#1A2C3D" : "#E5E7EB"}
              />
            </View>
          </View>

          {/* App Icon Selection */}
          <BaseText className="text-[17px] font-sf-bold text-black dark:text-white mb-4">
            App Icon
          </BaseText>
          <View className="flex-row justify-between">
            {ICONS.map((icon) => {
              const isSelected = selectedIcon === icon.id;
              return (
                <TouchableOpacity
                  key={icon.id}
                  onPress={() => setSelectedIcon(icon.id)}
                  activeOpacity={0.8}
                  className="items-center w-[22%]"
                >
                  <View
                    className={`w-full aspect-square rounded-2xl bg-white items-center justify-center mb-2 ${
                      isSelected ? "border-[3px]" : "border-0"
                    }`}
                    style={{ borderColor: icon.color }}
                  >
                    <LogoIcon width={48} height={48} color={icon.color} />
                  </View>
                  <View className="px-2 py-[2px] rounded">
                    <BaseText
                      className="text-xs font-sf-medium"
                      style={{ color: isSelected ? icon.color : "#9CA3AF" }}
                    >
                      {icon.label}
                    </BaseText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
