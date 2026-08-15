import { forwardRef } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";
import { BaseText } from "./BaseText";

const inputVariants = tv({
  base: "border border rounded-xl border-divider dark:border-divider-dark p-4 mb-10 text-white",
  variants: {
    size: {
      default: "text-2xl",
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
  className?: string;
}

export const BaseInput = forwardRef<TextInput, BaseInputProps>(
  ({ label, className, size, ...props }, ref) => {
    return (
      <View>
        {label && (
          <BaseText type="h5" className="mb-4">
            {label}
          </BaseText>
        )}
        <TextInput
          ref={ref}
          className={inputVariants({ size, className })}
          placeholderTextColor={props.placeholderTextColor || "#9ca3af"}
          {...props}
        />
      </View>
    );
  },
);

BaseInput.displayName = "BaseInput";
