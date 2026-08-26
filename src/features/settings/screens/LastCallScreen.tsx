import { BaseText, ScreenHeader } from "@/shared/components";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function LastCallScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader
        title="Last call"
        onBack={() => router.back()}
        useSafeArea
      />
      <View className="flex-1 items-center justify-center p-6">
        <BaseText className="text-lg text-neutral-500 dark:text-neutral-300">
          Last call information will appear here.
        </BaseText>
      </View>
    </View>
  );
}
