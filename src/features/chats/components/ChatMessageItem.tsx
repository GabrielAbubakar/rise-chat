import { BaseText } from "@/shared/components";
import { formatChatDateSeparator, formatTime } from "@/shared/utils";
import { memo, useCallback, useMemo } from "react";
import { View } from "react-native";
import { MessageResponseDto } from "../types";
import type { MessageAnchor } from "./MessageActionsMenu";
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
  currentUserId?: string;
  /** The replied-to message when it is in the loaded history. */
  replyToMessage?: MessageResponseDto;
  getSenderName: (senderId: string) => string;
  onLongPressMessage?: (item: MessageResponseDto, anchor: MessageAnchor) => void;
  onPressReaction?: (item: MessageResponseDto, emoji: string) => void;
  onPressReplyQuote?: (messageId: string) => void;
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
    currentUserId,
    replyToMessage,
    getSenderName,
    onLongPressMessage,
    onPressReaction,
    onPressReplyQuote,
  }: ChatMessageItemProps) => {
    const isDeleted = !!item.deletedAt;
    // Deleted placeholders have no actions; pending/failed sends only allow Copy.
    const canOpenMenu = !isDeleted && !!onLongPressMessage;

    const handleLongPress = useCallback(
      (anchor: MessageAnchor) => onLongPressMessage?.(item, anchor),
      [onLongPressMessage, item],
    );

    const handlePressReaction = useCallback(
      (emoji: string) => onPressReaction?.(item, emoji),
      [onPressReaction, item],
    );

    const replyToMessageId = item.replyToMessageId;
    const replyQuote = useMemo(
      () =>
        replyToMessageId
          ? {
              conversationId: item.conversationId,
              replyToMessageId,
              replyToMessage,
              getSenderName,
              onPress: onPressReplyQuote,
            }
          : undefined,
      [
        replyToMessageId,
        item.conversationId,
        replyToMessage,
        getSenderName,
        onPressReplyQuote,
      ],
    );

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
          isDeleted={isDeleted}
          isEdited={!!item.editedAt}
          reactions={item.reactions}
          currentUserId={currentUserId}
          replyQuote={replyQuote}
          onLongPress={canOpenMenu ? handleLongPress : undefined}
          onPressReaction={onPressReaction ? handlePressReaction : undefined}
        />
      </View>
    );
  },
  (prev, next) => {
    // `item` is a fresh object on every render (the screen adds
    // showDateSeparator), so compare the fields that affect rendering.
    return (
      prev.item.id === next.item.id &&
      prev.item.status === next.item.status &&
      prev.item.version === next.item.version &&
      prev.item.text === next.item.text &&
      prev.item.attachments === next.item.attachments &&
      prev.item.reactions === next.item.reactions &&
      prev.item.deletedAt === next.item.deletedAt &&
      prev.item.editedAt === next.item.editedAt &&
      prev.item.replyToMessageId === next.item.replyToMessageId &&
      prev.replyToMessage === next.replyToMessage &&
      prev.deliveryStatus === next.deliveryStatus &&
      prev.isCurrentMatch === next.isCurrentMatch &&
      prev.searchQuery === next.searchQuery &&
      prev.showDateSeparator === next.showDateSeparator &&
      prev.senderName === next.senderName &&
      prev.senderAvatar === next.senderAvatar &&
      prev.isGroupChat === next.isGroupChat &&
      prev.currentUserId === next.currentUserId &&
      prev.onRetry === next.onRetry &&
      prev.getSenderName === next.getSenderName &&
      prev.onLongPressMessage === next.onLongPressMessage &&
      prev.onPressReaction === next.onPressReaction &&
      prev.onPressReplyQuote === next.onPressReplyQuote
    );
  },
);

ChatMessageItem.displayName = "ChatMessageItem";
