import { useLogout } from "@/features/auth/hooks/useAuth";
import { tokenStorage } from "@/services/api/token";
import { Avatar, BaseText, BaseTouchableOpacity } from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
import { useSecurityStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

// Icons
import ChevronRightIcon from "@/assets/icons/outline/cheveron-right.svg";
import EditIcon from "@/assets/icons/outline/pencil-alt.svg";
import QrCodeIcon from "@/assets/icons/outline/qrcode.svg";

import { useSettingsData } from "../constants/settingsData";
import { useGetMe } from "../hooks/useProfile";
import { useThemeColors } from "@/shared/hooks";

export function SettingsScreen() {
  const router = useRouter();
  const { primary } = useThemeColors();

  const { data: user } = useGetMe();
  const { mutate: logoutApi, isPending } = useLogout({
    onSettled: async () => {
      await useAuthStore.getState().logout();
    },
    onSuccess: () => {
      showSuccessToast("Logged out successfully");
    },
    onError: (error) => {
      showApiErrorToast(error, "Failed to logout from server");
    },
  });

  const handleLogout = async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      logoutApi({ refreshToken });
    } else {
      await useAuthStore.getState().logout();
      useSecurityStore.getState().reset();
    }
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  const renderItem = (
    icon: React.ReactNode,
    label: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    isLastInGroup?: boolean,
  ) => {
    return (
      <View className="px-6">
        <TouchableOpacity
          onPress={onPress}
          disabled={!onPress}
          className={`flex-row items-center justify-between py-4 ${!isLastInGroup ? "" : ""}`}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary-50 dark:bg-neutral-700 items-center justify-center mr-4">
              {icon}
            </View>
            <BaseText className="text-[17px] font-sf-medium text-black dark:text-white">
              {label}
            </BaseText>
          </View>
          {rightElement || (
            <ChevronRightIcon width={24} height={24} color="#6E8597" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const { group1Data, group2Data } = useSettingsData(confirmLogout, isPending);

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-12 pb-6">
          <BaseText className="text-3xl font-bold text-black dark:text-white">
            Settings
          </BaseText>
          <BaseTouchableOpacity
            onPress={() => router.push("/settings/edit-profile")}
          >
            <EditIcon width={24} height={24} color={primary} />
          </BaseTouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="flex-row items-center justify-between px-6 pb-6">
          <View className="flex-row items-center">
            <Avatar
              type={user?.avatarUrl ? "image" : "initials"}
              source={user?.avatarUrl || undefined}
              initials={(user?.displayName || "Roberto William")
                .split(" ")
                .map((n) => n[0])
                .join("")}
              size={64}
              className="mr-4"
            />
            <View>
              <BaseText className="text-xl font-bold text-black dark:text-white mb-1">
                {user?.displayName || "Roberto William"}
              </BaseText>
              <BaseText className="text-[15px] text-neutral-300">
                {user?.phoneNumber || "+61-827-680-673"}
              </BaseText>
            </View>
          </View>
          <BaseTouchableOpacity
            onPress={() => router.push("/settings/qr-code")}
          >
            <QrCodeIcon width={28} height={28} color={primary} />
          </BaseTouchableOpacity>
        </View>

        <View className="h-[1px] bg-divider dark:bg-divider-dark mx-6 mb-2" />

        {/* Group 1 */}
        {group1Data.map((item, index) => (
          <React.Fragment key={item.label}>
            {renderItem(
              item.icon,
              item.label,
              item.onPress,
              item.rightElement,
              index === group1Data.length - 1,
            )}
          </React.Fragment>
        ))}

        <View className="h-[1px] bg-divider dark:bg-divider-dark mx-6 my-2" />

        {/* Group 2 */}
        {group2Data.map((item, index) => (
          <React.Fragment key={item.label}>
            {renderItem(
              item.icon,
              item.label,
              item.onPress,
              item.rightElement,
              index === group2Data.length - 1,
            )}
          </React.Fragment>
        ))}

        <View className="px-6 mt-8">
          <BaseText className="text-sm text-neutral-300">
            {new Date().getFullYear()} ChatMe • Ver 1.0
          </BaseText>
        </View>
      </ScrollView>
    </View>
  );
}
