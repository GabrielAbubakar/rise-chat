import React, { useRef, useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { BaseText } from "./BaseText";
import { tv } from "tailwind-variants";

const boxVariants = tv({
  base: "h-16 flex-1 border rounded-2xl items-center justify-center bg-transparent",
  variants: {
    state: {
      default: "border-divider dark:border-divider-dark",
      active: "border-primary",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

export interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
}

export function OtpInput({ length = 4, value, onChangeText }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const boxes = Array.from({ length }).map((_, index) => {
    const char = value[index] || "";
    // Box is active if it's the current one to be typed into, or if it already has a value
    const isCurrent = isFocused && (value.length === index || (index === length - 1 && value.length === length));
    const hasValue = char !== "";

    return (
      <View
        key={index}
        className={boxVariants({
          state: isCurrent || hasValue ? "active" : "default",
        })}
      >
        <BaseText className="text-3xl font-display text-black dark:text-white">{char}</BaseText>
      </View>
    );
  });

  return (
    <View>
      <Pressable
        className="flex-row gap-4"
        onPress={() => inputRef.current?.focus()}
      >
        {boxes}
      </Pressable>
      <TextInput
        ref={inputRef}
        className="absolute w-0 h-0 opacity-0"
        value={value}
        onChangeText={(text) => {
          // only numbers
          const cleaned = text.replace(/[^\d]/g, "");
          if (cleaned.length <= length) {
            onChangeText(cleaned);
          }
        }}
        keyboardType="number-pad"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden
      />
    </View>
  );
}
