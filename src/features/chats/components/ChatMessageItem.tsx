import { BaseText } from "@/shared/components";
import { formatChatDateSeparator, formatTime } from "@/shared/utils";
import { memo } from "react";
import { View } from "react-native";
import { MessageResponseDto } from "../types";
import { MessagePill } from "./MessagePill";

export interface ChatMessageItemProps {
  item: MessageResponseDto;
  isMe: boolean;
  isCurrentMatch: boolean;
  searchQuery?: string;
  showDateSeparator: boolean;
}

export const ChatMessageItem = memo(
  ({
    item,
    isMe,
    isCurrentMatch,
    searchQuery,
    showDateSeparator,
  }: ChatMessageItemProps) => {
    return (
      <View>
        {showDateSeparator ? (
          <View className="items-center my-4">
            <View className="bg-gray-200/80 dark:bg-gray-800/80 px-3 py-1 rounded-full">
              <BaseText className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                {formatChatDateSeparator(item.createdAt)}
              </BaseText>
            </View>
          </View>
        ) : null}
        <MessagePill
          isMe={isMe}
          text={item.text || ""}
          time={formatTime(item.createdAt)}
          searchQuery={searchQuery}
          isCurrentMatch={isCurrentMatch}
          attachments={item.attachments}
        />
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.text === next.item.text &&
      prev.isCurrentMatch === next.isCurrentMatch &&
      prev.searchQuery === next.searchQuery &&
      prev.showDateSeparator === next.showDateSeparator
    );
  },
);

ChatMessageItem.displayName = "ChatMessageItem";
