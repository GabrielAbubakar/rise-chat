import React from "react";
import { BaseText } from "@/shared/components";
import { View } from "react-native";

export interface MessagePillProps {
  isMe: boolean;
  text: string;
  time: string;
  searchQuery?: string;
  isCurrentMatch?: boolean;
}

export function MessagePill({
  isMe,
  text,
  time,
  searchQuery,
  isCurrentMatch = false,
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
    <View
      className={`flex-row mb-4 px-4 ${isMe ? "justify-end" : "justify-start"}`}
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
        {renderMessageContent()}
      </View>

      {!isMe && (
        <BaseText className="text-neutral-300 dark:text-neutral-300 ml-2 self-center mb-1">
          {time}
        </BaseText>
      )}
    </View>
  );
}

