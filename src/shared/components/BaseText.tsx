import React from "react";
import { Text, TextProps } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const textVariants = tv({
  base: "font-normal",
  variants: {
    type: {
      // sets the font size and weight
      h1: "text-h1 font-sf-bold",
      h2: "text-h2 font-sf-bold",
      h3: "text-h3 font-sf-bold",
      h4: "text-h4 font-sf-bold",
      h5: "text-h5 font-sf-bold",
      h6: "text-h6 font-sf-bold",
      "body-lg": "text-body-lg font-sf-regular",
      "body-md": "text-body-md font-sf-regular",
      "body-sm": "text-body-sm font-sf-regular",
      "button-big": "text-button-big font-sf-bold",
      "button-small": "text-button-small font-sf-bold",
    },
    weight: {
      regular: "font-sf-regular",
      medium: "font-sf-medium",
      semibold: "font-sf-semibold",
      bold: "font-sf-bold",
    },
    align: {
      auto: "text-auto",
      left: "text-left",
      right: "text-right",
      center: "text-center",
      justify: "text-justify",
    },
    color: {
      default: "text-label dark:text-label-dark",
      primary: "text-primary dark:text-primary",
      primary50: "text-primary/50 dark:text-primary/50",
      secondary: "text-neutral-300 dark:text-neutral-300",
      error: "text-red-500 dark:text-red-500",
    },
  },
  defaultVariants: {
    type: "body-md",
    align: "left",
    color: "default",
  },
}, {
  twMergeConfig: {
    classGroups: {
      "font-size": [{ text: ["h1", "h2", "h3", "h4", "h5", "h6", "body-lg", "body-md", "body-sm", "button-big", "button-small"] }],
    },
  },
});

import Animated from "react-native-reanimated";

export interface BaseTextProps
  extends TextProps, VariantProps<typeof textVariants> {
  children: React.ReactNode;
  animated?: boolean;
  entering?: any;
  exiting?: any;
  layout?: any;
}

export function BaseText({
  className,
  type,
  weight,
  align,
  color,
  animated,
  entering,
  exiting,
  layout,
  ...props
}: BaseTextProps) {
  const styles = textVariants({ type, weight, align, color, className });

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
