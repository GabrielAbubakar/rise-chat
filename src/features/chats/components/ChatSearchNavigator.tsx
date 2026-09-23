import React from "react";
import { Pressable, View } from "react-native";
import { BaseText } from "@/shared/components";
import ChevronDownIcon from "@/assets/icons/solid/cheveron-down.svg";
import ChevronUpIcon from "@/assets/icons/solid/cheveron-up.svg";

export interface ChatSearchNavigatorProps {
  totalMatches: number;
  currentMatchIndex: number;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  isDark: boolean;
}

export function ChatSearchNavigator({
  totalMatches,
  currentMatchIndex,
  onPrevMatch,
  onNextMatch,
  isDark,
}: ChatSearchNavigatorProps) {
  return (
    <View className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-2 flex-row items-center justify-between">
      <BaseText className="text-neutral-900 dark:text-white font-sf-medium text-sm">
        {totalMatches > 0
          ? `${currentMatchIndex + 1} from ${totalMatches}`
          : "0 results"}
      </BaseText>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onPrevMatch}
          disabled={totalMatches === 0}
          className={`p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 ${
            totalMatches === 0
              ? "opacity-40"
              : "active:bg-neutral-200 dark:active:bg-neutral-600"
          }`}
        >
          <ChevronUpIcon
            width={18}
            height={18}
            color={isDark ? "white" : "#3A566A"}
          />
        </Pressable>
        <Pressable
          onPress={onNextMatch}
          disabled={totalMatches === 0}
          className={`p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 ${
            totalMatches === 0
              ? "opacity-40"
              : "active:bg-neutral-200 dark:active:bg-neutral-600"
          }`}
        >
          <ChevronDownIcon
            width={18}
            height={18}
            color={isDark ? "white" : "#3A566A"}
          />
        </Pressable>
      </View>
    </View>
  );
}
