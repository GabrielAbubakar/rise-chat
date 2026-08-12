import React from "react";
import { Text, TextProps } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const textVariants = tv({
  base: "text-label dark:text-label-dark",
  variants: {
    variant: {
      h1: "text-h1 font-sf-bold font-normal",
      h2: "text-h2 font-display font-normal",
      h3: "text-h3 font-display font-normal",
      h4: "text-h4 font-display font-normal",
      "title-2": "text-title-2 font-display font-normal",
      "body-lg": "text-body-lg font-text font-normal",
      "body-md": "text-body-md font-text font-normal",
      "body-sm": "text-body-sm font-text font-normal",
      callout: "text-callout font-text",
    },
    weight: {
      ultralight: "font-sf-ultralight",
      light: "font-sf-light",
      regular: "font-sf-regular",
      medium: "font-sf-medium",
      semibold: "font-sf-semibold",
      bold: "font-sf-bold",
      heavy: "font-sf-heavy",
      ultrabold: "font-sf-ultrabold",
    },
    align: {
      auto: "text-auto",
      left: "text-left",
      right: "text-right",
      center: "text-center",
      justify: "text-justify",
    },
  },
  defaultVariants: {
    variant: "body-md",
    align: "left",
  },
});

import Animated from "react-native-reanimated";

export interface BaseTextProps
  extends TextProps,
    VariantProps<typeof textVariants> {
  children: React.ReactNode;
  animated?: boolean;
  entering?: any;
  exiting?: any;
  layout?: any;
}

export function BaseText({
  className,
  variant,
  weight,
  align,
  animated,
  entering,
  exiting,
  layout,
  ...props
}: BaseTextProps) {
  const styles = textVariants({ variant, weight, align, className });

  if (animated) {
    return (
      <Animated.Text
        entering={entering}
        exiting={exiting}
        layout={layout}
        className={styles}
        {...(props as any)}
      />
    );
  }

  return <Text className={styles} {...props} />;
}
