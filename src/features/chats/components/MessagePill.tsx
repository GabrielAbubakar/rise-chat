import { BaseText } from "@/shared/components";
import React from "react";
import { View } from "react-native";

export interface MessagePillProps {
  isMe: boolean;
  text: string;
  time: string;
}

export function MessagePill({ isMe, text, time }: MessagePillProps) {
  return (
    <View
      className={`flex-row mb-4 px-4 ${isMe ? "justify-end" : "justify-start"}`}
    >
      {!isMe && (
        <BaseText className="text-neutral-300 dark:text-neutral-300 mr-2 self-end mb-1">
          {time}
        </BaseText>
      )}
      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isMe
            ? "bg-primary-400 rounded-br-sm"
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
        <BaseText
          type="body-lg"
          className={`font-sf-regular ${
            isMe ? "text-white" : "text-neutral-700 dark:text-white"
          }`}
        >
          {text}
        </BaseText>
      </View>
      {isMe && (
        <BaseText className="text-neutral-300 dark:text-neutral-300 ml-2 self-end mb-1">
          {time}
        </BaseText>
      )}
    </View>
  );
}
