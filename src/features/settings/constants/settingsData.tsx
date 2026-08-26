import React from "react";
import { Switch, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

// Icons
import BellIcon from "@/assets/icons/outline/bell.svg";
import DatabaseIcon from "@/assets/icons/outline/database.svg";
import FolderIcon from "@/assets/icons/outline/folder.svg";
import LockIcon from "@/assets/icons/outline/lock-closed.svg";
import LogoutIcon from "@/assets/icons/outline/logout.svg";
import AppearanceIcon from "@/assets/icons/outline/moon.svg";
import PhoneIcon from "@/assets/icons/outline/phone.svg";
import QuestionMarkIcon from "@/assets/icons/outline/question-mark-circle.svg";
import StarIcon from "@/assets/icons/outline/star.svg";

export const useSettingsData = (
  confirmLogout: () => void,
  isPending: boolean
) => {
  const router = useRouter();

  const group1Data = [
    {
      icon: <StarIcon width={20} height={20} color="#57B77D" />,
      label: "Star messages",
      onPress: () => router.push("/settings"),
    },
    {
      icon: <PhoneIcon width={20} height={20} color="#57B77D" />,
      label: "Last call",
      onPress: () => router.push("/settings/last-call"),
    },
    {
      icon: <FolderIcon width={20} height={20} color="#57B77D" />,
      label: "My folder",
      onPress: () => router.push("/settings/my-folder"),
    },
    {
      icon: <AppearanceIcon width={20} height={20} color="#57B77D" />,
      label: "Appearance",
      onPress: () => router.push("/settings/appearance"),
    },
    {
      icon: <BellIcon width={20} height={20} color="#57B77D" />,
      label: "Notification",
      rightElement: (
        <Switch
          value={true}
          onValueChange={() => {}}
          trackColor={{ false: "#DDE2E8", true: "#57B77D" }}
          thumbColor={"#FFFFFF"}
        />
      ),
    },
  ];

  const group2Data = [
    {
      icon: <LockIcon width={20} height={20} color="#57B77D" />,
      label: "Privacy",
      onPress: () => router.push("/settings/privacy"),
    },
    {
      icon: <DatabaseIcon width={20} height={20} color="#57B77D" />,
      label: "Data and storage",
      onPress: () => router.push("/settings/data-storage"),
    },
    {
      icon: <QuestionMarkIcon width={20} height={20} color="#57B77D" />,
      label: "FAQ",
      onPress: () => router.push("/settings/faq"),
    },
    {
      icon: <LogoutIcon width={20} height={20} color="#57B77D" />,
      label: "Logout",
      onPress: confirmLogout,
      rightElement: isPending ? (
        <ActivityIndicator size="small" color="#57B77D" />
      ) : (
        <View />
      ),
    },
  ];

  return { group1Data, group2Data };
};
