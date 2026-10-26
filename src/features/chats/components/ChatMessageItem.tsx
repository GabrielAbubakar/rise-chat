import { BaseText } from "@/shared/components";
import { formatChatDateSeparator, formatTime } from "@/shared/utils";
import { memo } from "react";
import { View } from "react-native";
import { MessageResponseDto } from "../types";
import { DeliveryStatus, MessagePill } from "./MessagePill";

export interface ChatMessageItemProps {
  item: MessageResponseDto;
  isMe: boolean;
  isCurrentMatch: boolean;
  searchQuery?: string;
  showDateSeparator: boolean;
  senderName?: string | null;
  senderAvatar?: string | null;
  isGroupChat?: boolean;
  deliveryStatus?: DeliveryStatus;
  onRetry?: () => void;
}

export const ChatMessageItem = memo(
  ({
    item,
    isMe,
    isCurrentMatch,
    searchQuery,
    showDateSeparator,
    senderName,
    senderAvatar,
    isGroupChat,
    deliveryStatus,
    onRetry,
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
          senderName={senderName}
          senderAvatar={senderAvatar}
          isGroupChat={isGroupChat}
          senderId={item.senderId}
          status={item.status}
          deliveryStatus={deliveryStatus}
          onRetry={onRetry}
        />
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.status === next.item.status &&
      prev.item.text === next.item.text &&
      prev.item.attachments === next.item.attachments &&
      prev.deliveryStatus === next.deliveryStatus &&
      prev.isCurrentMatch === next.isCurrentMatch &&
      prev.searchQuery === next.searchQuery &&
      prev.showDateSeparator === next.showDateSeparator &&
      prev.senderName === next.senderName &&
      prev.senderAvatar === next.senderAvatar &&
      prev.isGroupChat === next.isGroupChat &&
      prev.onRetry === next.onRetry
    );
  },
);

ChatMessageItem.displayName = "ChatMessageItem";
