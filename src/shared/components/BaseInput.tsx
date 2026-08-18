import React, { forwardRef, useState } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";
import { BaseText } from "./BaseText";

const containerVariants = tv({
  base: "flex-row items-center border rounded-xl overflow-hidden mb-10",
  variants: {
    state: {
      default: "border-divider dark:border-divider-dark bg-transparent",
      active: "border-primary-400 bg-primary-50 dark:bg-neutral-800",
    },
    size: {
      default: "px-[12px] py-[18px]",
      large: "px-[12px] py-[18px]",
    },
  },
  defaultVariants: {
    state: "default",
    size: "default",
  },
});

const inputVariants = tv({
  base: "flex-1 text-black dark:text-white py-0",
  variants: {
    size: {
      default: "text-body-lg",
      large: "text-3xl tracking-widest",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface BaseInputProps
  extends TextInputProps, VariantProps<typeof inputVariants> {
  label?: string;
  className?: string; // Applies to the outer container
  inputClassName?: string; // Applies to the text input
  leftComponent?: React.ReactNode;
}

export const BaseInput = forwardRef<TextInput, BaseInputProps>(
  (
    { label, className, inputClassName, size, leftComponent, ...props },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View>
        {label && (
          <BaseText type="h5" className="mb-4">
            {label}
          </BaseText>
        )}
        <View className={containerVariants({ size, state: isFocused ? "active" : "default", className })}>
          {leftComponent}
          <TextInput
            ref={ref}
            className={inputVariants({ size, className: inputClassName })}
            placeholderTextColor={props.placeholderTextColor || "#9ca3af"}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </View>
      </View>
    );
  },
);

BaseInput.displayName = "BaseInput";
