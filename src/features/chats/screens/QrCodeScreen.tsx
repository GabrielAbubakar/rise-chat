import React from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import Svg, { Rect } from "react-native-svg";

// Shared Components
import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";

// Icons
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";
import QrCodeIcon from "@/assets/icons/solid/qrcode.svg";

// Dummy Data
import { DUMMY_CHATS } from "@/constants/dummyData";

const { width: windowWidth } = Dimensions.get("window");

export function QrCodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const chat = DUMMY_CHATS.find((c) => c.id === id) || DUMMY_CHATS[0];
  const userAvatar =
    chat.avatar ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800";

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      className="flex-1 bg-primary-400 dark:bg-app-dark justify-between"
    >
      {/* Header */}
      <ScreenHeader
        useSafeArea
        withPadding={false}
        className="z-10 bg-primary-400 dark:bg-app-dark border-b border-white/10 dark:border-neutral-700/60 pt-2"
      >
        <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="w-10 h-10 items-start justify-center"
          >
            <ArrowLeftIcon width={24} height={24} color="white" />
          </Pressable>

          <BaseText className="text-white text-lg font-sf-bold">
            QR Code
          </BaseText>

          <View className="w-10 h-10" />
        </View>
      </ScreenHeader>

      {/* Center QR Card */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="relative w-full max-w-[340px] bg-white rounded-3xl pt-12 pb-8 px-6 items-center shadow-2xl">
          {/* Overlapping Avatar */}
          <View className="absolute -top-10 w-20 h-20 rounded-full border-4 border-primary-400 dark:border-app-dark overflow-hidden bg-neutral-200 shadow-md">
            <Image
              source={{ uri: userAvatar }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>

          {/* User Details */}
          <BaseText className="text-neutral-900 font-sf-bold text-xl mt-1">
            {chat.name}
          </BaseText>
          <BaseText className="text-neutral-500 font-sf-regular text-sm mt-0.5 mb-6">
            {chat.phone || "+61-123-753-555"}
          </BaseText>

          {/* Stylized QR Code Graphic */}
          <View className="w-[200px] h-[200px] items-center justify-center p-2 bg-white rounded-xl">
            <Svg width="184" height="184" viewBox="0 0 29 29">
              {/* Corner Position Boxes */}
              {/* Top-Left */}
              <Rect x="1" y="1" width="7" height="7" fill="#081C2C" rx="1" />
              <Rect x="2.2" y="2.2" width="4.6" height="4.6" fill="#FFFFFF" />
              <Rect x="3.2" y="3.2" width="2.6" height="2.6" fill="#081C2C" />

              {/* Top-Right */}
              <Rect x="21" y="1" width="7" height="7" fill="#081C2C" rx="1" />
              <Rect x="22.2" y="2.2" width="4.6" height="4.6" fill="#FFFFFF" />
              <Rect x="23.2" y="3.2" width="2.6" height="2.6" fill="#081C2C" />

              {/* Bottom-Left */}
              <Rect x="1" y="21" width="7" height="7" fill="#081C2C" rx="1" />
              <Rect x="2.2" y="22.2" width="4.6" height="4.6" fill="#FFFFFF" />
              <Rect x="3.2" y="23.2" width="2.6" height="2.6" fill="#081C2C" />

              {/* Data Pattern Dots */}
              <Rect x="10" y="1" width="2" height="2" fill="#081C2C" />
              <Rect x="14" y="2" width="2" height="2" fill="#081C2C" />
              <Rect x="17" y="1" width="2" height="2" fill="#081C2C" />
              <Rect x="10" y="4" width="3" height="2" fill="#081C2C" />
              <Rect x="15" y="5" width="2" height="3" fill="#081C2C" />

              <Rect x="1" y="10" width="2" height="2" fill="#081C2C" />
              <Rect x="4" y="10" width="2" height="3" fill="#081C2C" />
              <Rect x="7" y="11" width="2" height="2" fill="#081C2C" />
              <Rect x="10" y="9" width="3" height="3" fill="#081C2C" />
              <Rect x="14" y="10" width="2" height="2" fill="#081C2C" />
              <Rect x="18" y="9" width="2" height="3" fill="#081C2C" />
              <Rect x="22" y="10" width="3" height="2" fill="#081C2C" />
              <Rect x="26" y="11" width="2" height="2" fill="#081C2C" />

              <Rect x="2" y="14" width="3" height="2" fill="#081C2C" />
              <Rect x="7" y="14" width="2" height="2" fill="#081C2C" />
              <Rect x="11" y="13" width="2" height="3" fill="#081C2C" />
              <Rect x="15" y="14" width="3" height="2" fill="#081C2C" />
              <Rect x="20" y="13" width="2" height="2" fill="#081C2C" />
              <Rect x="24" y="14" width="3" height="2" fill="#081C2C" />

              <Rect x="1" y="17" width="2" height="3" fill="#081C2C" />
              <Rect x="5" y="18" width="2" height="2" fill="#081C2C" />
              <Rect x="9" y="17" width="3" height="2" fill="#081C2C" />
              <Rect x="13" y="18" width="2" height="3" fill="#081C2C" />
              <Rect x="17" y="17" width="2" height="2" fill="#081C2C" />
              <Rect x="21" y="18" width="3" height="2" fill="#081C2C" />
              <Rect x="25" y="17" width="2" height="3" fill="#081C2C" />

              <Rect x="10" y="21" width="2" height="3" fill="#081C2C" />
              <Rect x="14" y="22" width="3" height="2" fill="#081C2C" />
              <Rect x="19" y="21" width="2" height="3" fill="#081C2C" />
              <Rect x="23" y="22" width="2" height="2" fill="#081C2C" />
              <Rect x="26" y="21" width="2" height="3" fill="#081C2C" />

              <Rect x="10" y="26" width="3" height="2" fill="#081C2C" />
              <Rect x="15" y="25" width="2" height="3" fill="#081C2C" />
              <Rect x="18" y="26" width="3" height="2" fill="#081C2C" />
              <Rect x="23" y="25" width="2" height="2" fill="#081C2C" />
              <Rect x="26" y="26" width="2" height="2" fill="#081C2C" />
            </Svg>
          </View>
        </View>
      </View>

      {/* Bottom Scan QR Button */}
      <View className="px-6 pb-10">
        <Pressable
          onPress={() => router.back()}
          className="w-full flex-row items-center justify-center py-4 rounded-full bg-white/20 dark:bg-neutral-800 border border-white/30 dark:border-neutral-700 active:opacity-80"
        >
          <QrCodeIcon
            width={20}
            height={20}
            color={isDark ? "#57B77D" : "#FFFFFF"}
          />
          <BaseText className="text-white font-sf-semibold text-base ml-2.5">
            Scan QR code
          </BaseText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
