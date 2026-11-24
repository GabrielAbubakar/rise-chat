import { BaseText } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { MessageResponseDto } from "../types";
import { getMessagePreview } from "./MessageReplyQuote";

export interface ReplyPreviewBarProps {
  message: MessageResponseDto;
  /** "reply" shows who you are replying to; "edit" shows the message being edited. */
  mode?: "reply" | "edit";
  senderName?: string;
  onCancel: () => void;
  isDark?: boolean;
}

/** Shown above the composer while you are replying to or editing a message. */
export function ReplyPreviewBar({
  message,
  mode = "reply",
  senderName,
  onCancel,
  isDark = false,
}: ReplyPreviewBarProps) {
  const isEdit = mode === "edit";
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutDown.duration(200)}
      className="mx-4 mb-2 bg-white dark:bg-neutral-800 rounded-2xl border border-divider dark:border-neutral-700 flex-row items-center overflow-hidden shadow-md"
    >
      <View className="w-1 self-stretch bg-primary-400" />
      <Ionicons
        name={isEdit ? "pencil" : "arrow-undo"}
        size={18}
        color="#10B981"
        style={{ marginLeft: 12 }}
      />
      <View className="flex-1 px-3 py-2.5">
        <BaseText
          numberOfLines={1}
          className="text-xs font-sf-bold text-primary-500 dark:text-primary-300"
        >
          {isEdit ? "Editing message" : `Replying to ${senderName ?? "message"}`}
        </BaseText>
        <BaseText
          numberOfLines={1}
          className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5"
        >
          {getMessagePreview(message)}
        </BaseText>
      </View>
      <Pressable
        onPress={onCancel}
        className="w-8 h-8 mr-3 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center active:opacity-70"
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? "Cancel editing" : "Cancel reply"}
      >
        <Ionicons name="close" size={18} color={isDark ? "#E5E7EB" : "#374151"} />
      </Pressable>
    </Animated.View>
  );
}
