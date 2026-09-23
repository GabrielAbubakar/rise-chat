import { BaseText } from "@/shared/components";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";
import { MessageAttachmentResponseDto } from "../types";

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

export interface MessagePillProps {
  isMe: boolean;
  text?: string;
  time: string;
  searchQuery?: string;
  isCurrentMatch?: boolean;
  attachments?: MessageAttachmentResponseDto[];
}

export function MessagePill({
  isMe,
  text = "",
  time,
  searchQuery,
  isCurrentMatch = false,
  attachments,
}: MessagePillProps) {
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
        <BaseText className="text-neutral-300 dark:text-neutral-300 mr-2 self-center mb-1">
          {time}
        </BaseText>
      )}
      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isMe
            ? "bg-primary-400 rounded-br-sm"
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
      >
        {attachments?.map((attachment, index) => (
          <Image
            key={attachment.mediaId || index}
            source={attachment.url}
            style={{ width: 200, height: 200, marginBottom: text ? 8 : 0 }}
            contentFit="cover"
          />
        ))}
        {!!text && renderMessageContent()}
      </View>

      {!isMe && (
        <BaseText className="text-neutral-300 dark:text-neutral-300 ml-2 self-center mb-1">
          {time}
        </BaseText>
      )}
    </Animated.View>
  );
}
