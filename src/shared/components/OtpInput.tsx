import { useThemeColors } from "@/shared/hooks";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { tv } from "tailwind-variants";
import { BaseText } from "./BaseText";

const boxVariants = tv({
  base: "h-16 flex-1 border rounded-2xl items-center justify-center bg-transparent",
  variants: {
    state: {
      default: "border-divider dark:border-divider-dark",
      active: "bg-primary-50 dark:bg-neutral-800",
      error: "border-red-500 bg-red-50 dark:bg-red-900/20",
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
  isError?: boolean;
}

export function OtpInput({
  length = 4,
  value,
  onChangeText,
  isError,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { primary } = useThemeColors();

  const boxes = Array.from({ length }).map((_, index) => {
    const char = value[index] || "";
    // Box is active if it's the current one to be typed into, or if it already has a value
    const isCurrent =
      isFocused &&
      (value.length === index ||
        (index === length - 1 && value.length === length));
    const hasValue = char !== "";
    const isActiveState = !isError && (isCurrent || hasValue);

    return (
      <View
        key={index}
        className={boxVariants({
          state: isError ? "error" : isActiveState ? "active" : "default",
        })}
        style={isActiveState ? { borderColor: primary } : undefined}
        accessible={false}
        importantForAccessibility="no"
      >
        <BaseText className="text-3xl font-display text-black dark:text-white">
          {char}
        </BaseText>
      </View>
    );
  });

  return (
    <View className="relative">
      <Pressable
        className="flex-row gap-4"
        onPress={() => inputRef.current?.focus()}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {boxes}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={[StyleSheet.absoluteFill, { opacity: 0.01 }]}
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
        autoFocus
        accessible={true}
        accessibilityLabel={`Verification code input, ${length} digits`}
        accessibilityValue={{
          text: value.length > 0 ? value.split("").join(" ") : "Empty",
        }}
        accessibilityHint={`Enter the ${length}-digit verification code sent to your phone. Currently entered ${value.length} of ${length} digits.`}
      />
    </View>
  );
}
