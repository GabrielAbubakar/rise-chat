import { BaseText } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useMessage } from "../hooks/useConversationQueries";
import { MessageResponseDto } from "../types";

/** One-line summary of a message for reply quotes and the reply composer bar. */
export function getMessagePreview(message: MessageResponseDto): string {
  if (message.deletedAt) return "This message was deleted";
  const text = message.text?.trim();
  if (text) return text;
  const attachment = message.attachments?.[0];
  switch (attachment?.type ?? message.kind) {
    case "image":
      return "📷 Photo";
    case "video":
      return "🎥 Video";
    case "audio":
      return "🎤 Audio";
    case "document":
      return `📄 ${attachment?.originalFilename || "Document"}`;
    default:
      return "Message";
  }
}

export interface MessageReplyQuoteProps {
  conversationId: string;
  replyToMessageId: string;
  /** The target when it is already in the loaded history; otherwise it is fetched. */
  replyToMessage?: MessageResponseDto;
  isMe: boolean;
  getSenderName: (senderId: string) => string;
  onPress?: (messageId: string) => void;
  onLongPress?: () => void;
}

export function MessageReplyQuote({
  conversationId,
  replyToMessageId,
  replyToMessage,
  isMe,
  getSenderName,
  onPress,
  onLongPress,
}: MessageReplyQuoteProps) {
  // Only hits the network when the target isn't in the loaded pages.
  const { data: fetched, isError } = useMessage(
    replyToMessage ? "" : conversationId,
    replyToMessageId,
  );
  const target = replyToMessage ?? fetched;

  const title = target ? getSenderName(target.senderId) : "";
  const preview = target
    ? getMessagePreview(target)
    : isError
      ? "Message unavailable"
      : "Loading…";
  const isPlaceholder = !target || !!target.deletedAt;

  return (
    <Pressable
      onPress={() => onPress?.(replyToMessageId)}
      onLongPress={onLongPress}
      className={`mb-2 rounded-lg overflow-hidden flex-row ${
        isMe ? "bg-black/15" : "bg-neutral-100 dark:bg-neutral-700"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Reply to ${title || "message"}: ${preview}`}
      accessibilityHint="Jumps to the original message"
    >
      <View
        className={`w-1 ${isMe ? "bg-white/80" : "bg-primary-400"}`}
      />
      <View className="px-2.5 py-1.5 flex-shrink">
        {title ? (
          <BaseText
            numberOfLines={1}
            className={`text-xs font-sf-bold ${
              isMe ? "text-white" : "text-primary-500 dark:text-primary-300"
            }`}
          >
            {title}
          </BaseText>
        ) : null}
        <View className="flex-row items-center">
          {target?.deletedAt ? (
            <Ionicons
              name="ban-outline"
              size={12}
              color={isMe ? "#F3F4F6" : "#9CA3AF"}
              style={{ marginRight: 4 }}
            />
          ) : null}
          <BaseText
            numberOfLines={2}
            className={`text-sm ${isPlaceholder ? "italic" : ""} ${
              isMe ? "text-white/90" : "text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {preview}
          </BaseText>
        </View>
      </View>
    </Pressable>
  );
}
