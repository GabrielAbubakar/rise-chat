import { BaseText } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";
import {
  LocalMessageStatus,
  MESSAGE_REACTION_EMOJIS,
  MessageAttachmentResponseDto,
  MessageReactionDto,
} from "../types";
import { AttachmentItem } from "./AttachmentItem";
import type { MessageAnchor } from "./MessageActionsMenu";
import { MessageReplyQuote, MessageReplyQuoteProps } from "./MessageReplyQuote";

import CheckIcon from "@/assets/icons/solid/check.svg";
import ClockIcon from "@/assets/icons/solid/clock.svg";
import ExclamationCircleIcon from "@/assets/icons/solid/exclamation-circle.svg";

const messageEnteringAnimation = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 20 }, { scale: 0.8 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
}).duration(250);

export type DeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface MessagePillProps {
  isMe: boolean;
  text?: string;
  time: string;
  searchQuery?: string;
  isCurrentMatch?: boolean;
  attachments?: MessageAttachmentResponseDto[];
  senderName?: string | null;
  senderAvatar?: string | null;
  isGroupChat?: boolean;
  senderId?: string;
  status?: LocalMessageStatus;
  deliveryStatus?: DeliveryStatus;
  onRetry?: () => void;
  isDeleted?: boolean;
  isEdited?: boolean;
  /** Shown at the top of the bubble when this message is a reply. */
  replyQuote?: Omit<MessageReplyQuoteProps, "isMe" | "onLongPress">;
  reactions?: MessageReactionDto[];
  currentUserId?: string;
  /** Opens the message actions menu, anchored to the bubble's window frame. */
  onLongPress?: (anchor: MessageAnchor) => void;
  /** Tapping a reaction chip. */
  onPressReaction?: (emoji: string) => void;
}

const NAME_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

function getUserColor(userId?: string) {
  if (!userId) return NAME_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

function ReceiptStatusIcon({
  deliveryStatus,
  status,
  onRetry,
}: {
  deliveryStatus?: DeliveryStatus;
  status?: LocalMessageStatus;
  onRetry?: () => void;
}) {
  const currentStatus = deliveryStatus || status || "sent";

  if (currentStatus === "failed") {
    return (
      <Pressable
        onPress={onRetry}
        hitSlop={8}
        className="flex-row items-center bg-red-500/20 px-2 py-0.5 rounded-full ml-1"
      >
        <ExclamationCircleIcon width={13} height={13} color="#EF4444" />
        <BaseText className="text-[11px] text-red-500 font-bold ml-1">
          Retry
        </BaseText>
      </Pressable>
    );
  }

  if (currentStatus === "pending") {
    return (
      <View className="ml-1 self-center">
        <ClockIcon width={12} height={12} color="#94A3B8" />
      </View>
    );
  }

  if (currentStatus === "delivered") {
    return (
      <View className="flex-row items-center ml-1 self-center">
        <CheckIcon width={13} height={13} color="#94A3B8" />
        <View style={{ marginLeft: -8 }}>
          <CheckIcon width={13} height={13} color="#94A3B8" />
        </View>
      </View>
    );
  }

  if (currentStatus === "read") {
    return (
      <View className="flex-row items-center ml-1 self-center">
        <CheckIcon width={13} height={13} color="#38BDF8" />
        <View style={{ marginLeft: -8 }}>
          <CheckIcon width={13} height={13} color="#38BDF8" />
        </View>
      </View>
    );
  }

  // Sent (request accepted by server)
  return (
    <View className="ml-1 self-center">
      <CheckIcon width={13} height={13} color="#94A3B8" />
    </View>
  );
}

export function MessagePill({
  isMe,
  text = "",
  time,
  searchQuery,
  isCurrentMatch = false,
  attachments,
  senderName,
  senderAvatar,
  isGroupChat,
  senderId,
  status,
  deliveryStatus,
  onRetry,
  isDeleted = false,
  isEdited = false,
  replyQuote,
  reactions,
  currentUserId,
  onLongPress,
  onPressReaction,
}: MessagePillProps) {
  const bubbleRef = useRef<View>(null);

  const handleLongPress = useCallback(() => {
    if (!onLongPress) return;
    const node = bubbleRef.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) =>
      onLongPress({ x, y, width, height }),
    );
  }, [onLongPress]);

  const reactionGroups = useMemo(() => {
    if (!reactions?.length) return [];
    const counts = new Map<string, { count: number; mine: boolean }>();
    for (const r of reactions) {
      const entry = counts.get(r.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      entry.mine = entry.mine || r.userId === currentUserId;
      counts.set(r.emoji, entry);
    }
    const order = MESSAGE_REACTION_EMOJIS as readonly string[];
    return [...counts.entries()]
      .map(([emoji, v]) => ({ emoji, ...v }))
      .sort((a, b) => order.indexOf(a.emoji) - order.indexOf(b.emoji));
  }, [reactions, currentUserId]);

  const timeLabel = isEdited && !isDeleted ? `Edited ${time}` : time;

  const renderMessageContent = () => {
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery) {
      return (
        <BaseText
          type="body-lg"
          className={`font-sf-regular ${
            isMe ? "text-white" : "text-neutral-700 dark:text-white"
          }`}
        >
          {text}
        </BaseText>
      );
    }

    const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return (
      <BaseText
        type="body-lg"
        className={`font-sf-regular ${
          isMe ? "text-white" : "text-neutral-700 dark:text-white"
        }`}
      >
        {parts.map((part, index) => {
          if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
            return (
              <BaseText
                key={index}
                className={`${
                  isCurrentMatch
                    ? "bg-primary-400 text-white"
                    : "bg-primary-400/80 text-white"
                } rounded px-1 font-sf-bold`}
              >
                {part}
              </BaseText>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </BaseText>
    );
  };

  return (
    <Animated.View
      entering={messageEnteringAnimation}
      className={`flex-row mb-4 px-4 ${isMe ? "justify-end" : "justify-start"}`}
      style={{ transformOrigin: "top right" }}
    >
      {isMe && (
        <View className="flex-row items-center mr-2 self-center mb-1">
          <BaseText className="text-neutral-400 dark:text-neutral-400 text-xs">
            {timeLabel}
          </BaseText>
          <ReceiptStatusIcon
            deliveryStatus={deliveryStatus}
            status={status}
            onRetry={onRetry}
          />
        </View>
      )}

      {!isMe && isGroupChat && (
        <View className="mr-2 justify-end pb-1">
          {senderAvatar ? (
            <Image
              source={{ uri: senderAvatar }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
              <BaseText className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                {senderName ? senderName.charAt(0).toUpperCase() : "?"}
              </BaseText>
            </View>
          )}
        </View>
      )}
      <View
        className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}
      >
        <Pressable
          ref={bubbleRef}
          onLongPress={onLongPress ? handleLongPress : undefined}
          delayLongPress={300}
          className={`px-4 py-3 rounded-2xl ${
            isMe
              ? status === "failed"
                ? "bg-red-500/80 rounded-br-sm"
                : "bg-primary-400 rounded-br-sm"
              : isCurrentMatch
                ? "bg-white dark:bg-neutral-800 border-2 border-primary-400 rounded-bl-sm"
                : "bg-white dark:bg-neutral-800 rounded-bl-sm"
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
          accessibilityHint={
            onLongPress ? "Long press for reply, reactions and more" : undefined
          }
          accessibilityActions={
            onLongPress
              ? [{ name: "longpress", label: "Message actions" }]
              : undefined
          }
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "longpress") {
              handleLongPress();
            }
          }}
        >
          {!isMe && isGroupChat && senderName && (
            <BaseText
              style={{ color: getUserColor(senderId), marginBottom: 4 }}
              className="text-xs font-bold"
            >
              {senderName}
            </BaseText>
          )}
          {isDeleted ? (
            <View className="flex-row items-center">
              <Ionicons
                name="ban-outline"
                size={15}
                color={isMe ? "#F3F4F6" : "#9CA3AF"}
              />
              <BaseText
                type="body-md"
                className={`ml-1.5 italic ${
                  isMe ? "text-white/90" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {isMe ? "You deleted this message" : "This message was deleted"}
              </BaseText>
            </View>
          ) : (
            <>
              {replyQuote ? (
                <MessageReplyQuote
                  {...replyQuote}
                  isMe={isMe}
                  onLongPress={onLongPress ? handleLongPress : undefined}
                />
              ) : null}
              {attachments?.map((attachment, index) => (
                <AttachmentItem
                  key={attachment.mediaId || index}
                  attachment={attachment}
                  isMe={isMe}
                  hasText={!!text}
                  onLongPress={onLongPress ? handleLongPress : undefined}
                />
              ))}
              {!!text && renderMessageContent()}
            </>
          )}
        </Pressable>

        {reactionGroups.length > 0 && !isDeleted ? (
          <View
            className={`flex-row flex-wrap -mt-2 px-2 ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            {reactionGroups.map(({ emoji, count, mine }) => (
              <Pressable
                key={emoji}
                onPress={() => onPressReaction?.(emoji)}
                disabled={!onPressReaction}
                hitSlop={4}
                className={`flex-row items-center rounded-full px-1.5 py-0.5 mr-1 border ${
                  mine
                    ? "bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700"
                    : "bg-white dark:bg-neutral-800 border-divider dark:border-neutral-700"
                }`}
                accessibilityRole="button"
                accessibilityLabel={`${emoji} ${count}${
                  mine ? ", including you. Tap to remove" : ". Tap to react"
                }`}
              >
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                {count > 1 ? (
                  <BaseText className="text-[11px] ml-0.5 text-neutral-600 dark:text-neutral-300">
                    {count}
                  </BaseText>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {!isMe && (
        <BaseText className="text-neutral-400 dark:text-neutral-400 ml-2 self-center mb-1 text-xs">
          {timeLabel}
        </BaseText>
      )}
    </Animated.View>
  );
}
