import React, { forwardRef } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";
import { BaseText } from "./BaseText";

const containerVariants = tv({
  base: "flex-row items-center border rounded-xl border-divider dark:border-divider-dark overflow-hidden mb-10",
  variants: {
    size: {
      default: "px-[12px] py-[18px]",
      large: "px-[12px] py-[18px]",
    },
  },
  defaultVariants: {
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
    return (
      <View>
        {label && (
          <BaseText type="h5" className="mb-4">
            {label}
          </BaseText>
        )}
        <View className={containerVariants({ size, className })}>
          {leftComponent}
          <TextInput
            ref={ref}
            className={inputVariants({ size, className: inputClassName })}
            placeholderTextColor={props.placeholderTextColor || "#9ca3af"}
            {...props}
          />
        </View>
      </View>
    );
  },
);

BaseInput.displayName = "BaseInput";
