import CameraIcon from "@/assets/icons/outline/camera.svg";
import { BaseText, BaseTouchableOpacity, ScreenHeader } from "@/shared/components";
import { useGetMe } from "../hooks/useProfile";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export function QrCodeScreen() {
  const router = useRouter();
  const { data: user } = useGetMe();

  // Default to something, could be a user deep link in a real app
  const qrValue = user?.id ? `https://rise-chat.app/user/${user.id}` : "https://rise-chat.app/user/roberto";

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader
        onBack={() => router.back()}
        useSafeArea
        withPadding
        // We don't provide a title to match the screenshot
      />

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* We push the card down so the avatar can overlap the top of it */}
        <View className="mt-20">
          <View className="bg-surface dark:bg-surface-dark rounded-3xl">
            
            {/* Top Section: Avatar, Name, Phone */}
            <View className="items-center px-6 pb-8 relative rounded-t-3xl">
              <View className="absolute -top-12 self-center">
                <Image
                  source={
                    user?.avatarUrl
                      ? { uri: user.avatarUrl }
                      : require("@/assets/images/default-avatar.png")
                  }
                  className="w-24 h-24 rounded-full border-[4px] border-white bg-white"
                  defaultSource={require("@/assets/images/default-avatar.png")}
                />
              </View>

              <View className="mt-14 items-center">
                <BaseText className="text-[22px] font-sf-bold text-black dark:text-white mb-1">
                  {user?.displayName || "Roberto William"}
                </BaseText>
                <BaseText className="text-base text-neutral-400">
                  {user?.phoneNumber || "+61-827-680-673"}
                </BaseText>
              </View>
            </View>

            {/* Bottom Section: QR Code */}
            <View className="bg-[#091520] p-12 items-center justify-center rounded-b-3xl">
              <View className="bg-white p-4">
                <QRCode
                  value={qrValue}
                  size={220}
                  color="black"
                  backgroundColor="white"
                />
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Floating Scan Button */}
      <View className="absolute bottom-12 left-0 right-0 items-center">
        <BaseTouchableOpacity
          className="flex-row items-center bg-[#283A4A] px-6 py-4 rounded-full"
          onPress={() => {
            // Future implementation: open scanner
          }}
        >
          <CameraIcon width={24} height={24} color="white" />
          <BaseText className="text-white ml-3 font-medium text-[17px]">
            Scan QR code
          </BaseText>
        </BaseTouchableOpacity>
      </View>
    </View>
  );
}
