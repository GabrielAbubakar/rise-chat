import { BaseText, BaseTouchableOpacity, ScreenHeader, ScreenContainer } from "@/shared/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useThemeColors } from "@/shared/hooks";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import CheckCircleIcon from "@/assets/icons/solid/check-circle.svg";

export function PrivacySelectionScreen() {
  const router = useRouter();
  const { primary } = useThemeColors();
  const { type } = useLocalSearchParams<{ type: string }>();
  
  // Default selected depending on type, simplified for mock
  const [selected, setSelected] = useState(type === "Last Seen" || type === "Group" ? "Everyone" : "My Contact");

  const options = ["Everyone", "My Contact", "Nobody"];

  const renderOption = (label: string, isLast: boolean = false) => {
    const isSelected = selected === label;
    
    return (
      <View key={label} className="px-6">
        <BaseTouchableOpacity
          onPress={() => setSelected(label)}
          className="flex-row items-center justify-between py-5"
        >
          <BaseText className="text-[17px] font-medium text-black dark:text-white">
            {label}
          </BaseText>
          {isSelected ? (
            <CheckCircleIcon width={24} height={24} color={primary} />
          ) : (
            <View className="w-6 h-6 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
          )}
        </BaseTouchableOpacity>
        {!isLast && <View className="h-[1px] bg-divider dark:bg-divider-dark" />}
      </View>
    );
  };

  const getFooterText = () => {
    switch (type) {
      case "Last Seen":
        return "Users who have your number saved in their contacts will also see it.";
      case "Profile Photo":
        return "Choose who can see your profile photo.";
      case "About":
        return "Choose who can see your about info.";
      case "Group":
        return "Choose who can add you to groups.";
      default:
        return "Users who have your number saved in their contacts will also see it.";
    }
  };

  return (
    <ScreenContainer withPadding={false} isSafeArea={false} className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader className="pt-10" title={type || "Privacy"} onBack={() => router.back()} useSafeArea />
      
      <ScrollView className="flex-1 mt-2">
        {options.map((option, index) => 
          renderOption(option, index === options.length - 1)
        )}

        <View className="px-6 mt-4">
          <BaseText className="text-sm text-neutral-400 leading-5">
            {getFooterText()}
          </BaseText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
