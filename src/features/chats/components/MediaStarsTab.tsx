import { LegendList } from "@legendapp/list/react-native";
import { Image } from "expo-image";
import { View } from "react-native";

import ChevronRightIcon from "@/assets/icons/solid/cheveron-right.svg";
import StarIcon from "@/assets/icons/solid/star.svg";
import { DUMMY_STARRED_MESSAGES } from "@/constants/dummyData";
import { BaseText } from "@/shared/components";

export function MediaStarsTab({
  messages,
  isDark,
}: {
  messages: typeof DUMMY_STARRED_MESSAGES;
  isDark: boolean;
}) {
  return (
    <LegendList
      data={messages}
      keyExtractor={(item: any) => item.id}
      estimatedItemSize={120}
      contentContainerStyle={{
        gap: 16,
        paddingHorizontal: 16,
        paddingBottom: 40,
      }}
      renderItem={({ item: msg }: any) => (
        <View className="gap-y-2">
          {/* Message Bubble Card */}
          <View className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
            <BaseText className="text-neutral-900 dark:text-white font-sf-regular text-base leading-6">
              {msg.text}
            </BaseText>
            <View className="flex-row items-center justify-end mt-2 gap-1.5">
              <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-regular text-sm">
                {msg.time}
              </BaseText>
              <StarIcon width={13} height={13} color="#FBBF24" />
            </View>
          </View>

          {/* Sender Info Pill */}
          <View className="flex-row items-center justify-between px-2 py-1">
            <View className="flex-row items-center">
              <Image
                source={{ uri: msg.sender.avatar }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                contentFit="cover"
              />
              <BaseText className="text-neutral-900 dark:text-white font-sf-medium ml-2.5">
                {msg.sender.name}
              </BaseText>
            </View>
            <View className="flex-row items-center">
              <BaseText className="text-neutral-500 dark:text-neutral-400 text-sm mr-1">
                {msg.date}
              </BaseText>
              <ChevronRightIcon
                width={14}
                height={14}
                color={isDark ? "#6E8597" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>
      )}
    />
  );
}
