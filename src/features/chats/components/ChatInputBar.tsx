import PlaneIcon from "@/assets/icons/solid/paper-airplane.svg";
import PaperClipIcon from "@/assets/icons/solid/paper-clip.svg";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

export interface ChatInputBarProps {
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isPending: boolean;
  insetsBottom: number;
  isDark: boolean;
  onToggleAttachmentMenu?: () => void;
  isAttachmentMenuOpen?: boolean;
}

export function ChatInputBar({
  message,
  onChangeText,
  onSend,
  isPending,
  insetsBottom,
  isDark,
  onToggleAttachmentMenu,
  isAttachmentMenuOpen = false,
}: ChatInputBarProps) {
  return (
    <View
      className="bg-transparent px-4 py-3 flex-row items-end"
      style={{ paddingBottom: Math.max(insetsBottom, 12) }}
    >
      <View className="flex-1 flex-row items-end bg-app dark:bg-neutral-700 rounded-[24px] px-4 py-2 border border-divider dark:border-neutral-600">
        <Pressable
          className={`mr-3 mb-[14px] p-1 rounded-full ${
            isAttachmentMenuOpen
              ? "bg-emerald-100 dark:bg-emerald-900/40"
              : ""
          }`}
          onPress={onToggleAttachmentMenu}
          hitSlop={8}
        >
          <PaperClipIcon
            width={20}
            height={20}
            color={
              isAttachmentMenuOpen
                ? "#10B981"
                : isDark
                  ? "#9CA3AF"
                  : "#6B7280"
            }
          />
        </Pressable>
        <TextInput
          className="flex-1 text-label dark:text-label-dark text-body-lg py-3 max-h-[120px]"
          placeholder="Type your message..."
          placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
          value={message}
          onChangeText={onChangeText}
          multiline
        />
        <Pressable
          className="w-12 h-12 bg-primary-400 rounded-full items-center justify-center ml-3"
          onPress={onSend}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <PlaneIcon width={24} height={24} color="white" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
