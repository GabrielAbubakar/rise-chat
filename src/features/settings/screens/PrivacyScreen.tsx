import { BaseText, BaseTouchableOpacity, ScreenHeader, ScreenContainer } from "@/shared/components";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import ChevronRightIcon from "@/assets/icons/outline/cheveron-right.svg";

export function PrivacyScreen() {
  const router = useRouter();

  const renderItem = (
    label: string,
    value: string,
    onPress: () => void,
    isLast: boolean = false
  ) => (
    <View className="px-6">
      <BaseTouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between py-5"
      >
        <BaseText className="text-[17px] font-medium text-black dark:text-white">
          {label}
        </BaseText>
        <View className="flex-row items-center">
          {value ? (
            <BaseText className="text-base text-neutral-400 mr-2">
              {value}
            </BaseText>
          ) : null}
          <ChevronRightIcon width={20} height={20} color="#6E8597" />
        </View>
      </BaseTouchableOpacity>
      {!isLast && <View className="h-[1px] bg-divider dark:bg-divider-dark" />}
    </View>
  );

  return (
    <ScreenContainer withPadding={false} isSafeArea={false} className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader className="pt-10" title="Privacy" onBack={() => router.back()} useSafeArea />
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 10 }}>
        {renderItem("Last Seen", "Everyone", () => router.push({ pathname: "/settings/privacy-selection", params: { type: "Last Seen" } }))}
        {renderItem("Profile Photo", "My Contact", () => router.push({ pathname: "/settings/privacy-selection", params: { type: "Profile Photo" } }))}
        {renderItem("About", "My Contact", () => router.push({ pathname: "/settings/privacy-selection", params: { type: "About" } }))}
        {renderItem("Group", "Everyone", () => router.push({ pathname: "/settings/privacy-selection", params: { type: "Group" } }))}
        {renderItem("Blocked Contact", "3 Contacts", () => router.push("/settings/blocked-contact"))}
        {renderItem("Face ID", "", () => router.push("/settings/face-id"), true)}

        <View className="px-6 mt-4">
          <BaseText className="text-sm text-neutral-400 leading-5">
            With face ID, you can secure your apps
          </BaseText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
