import React from "react";
import { BaseInput } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

interface ChatSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function ChatSearchInput({ value, onChangeText }: ChatSearchInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <BaseInput
      placeholder="Search chat, people and more..."
      value={value}
      onChangeText={onChangeText}
      leftComponent={
        <Ionicons
          name="search"
          size={20}
          color={isDark ? "#6E8597" : "#FFFFFF"}
          className="mr-2"
        />
      }
      className="!bg-transparent border-white/30 dark:border-white/10 mb-0"
      inputClassName="text-white"
      placeholderTextColor={isDark ? "#6E8597" : "rgba(255, 255, 255, 0.8)"}
    />
  );
}
