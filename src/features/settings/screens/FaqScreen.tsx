import { BaseText, ScreenHeader } from "@/shared/components";
import { useRouter } from "expo-router";
import { View } from "react-native";

export function FaqScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader title="FAQ" onBack={() => router.back()} useSafeArea />
      <View className="flex-1 items-center justify-center p-6">
        <BaseText className="text-lg text-neutral-500 dark:text-neutral-300">
          FAQ will appear here.
        </BaseText>
      </View>
    </View>
  );
}
