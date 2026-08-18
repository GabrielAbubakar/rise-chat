import React from "react";
import { View, ViewProps } from "react-native";

export interface ScreenHeaderProps extends ViewProps {
  isSafeArea?: boolean;
  isScrollable?: boolean;
  withPadding?: boolean;
  isKeyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  keyboardBehavior?: "padding" | "height" | "position";
  children: React.ReactNode;
  contentContainerClassName?: string;
}

// Component for wrapping page screens
export function ScreenHeader({
  isSafeArea = true,
  isScrollable = false,
  withPadding = true,
  isKeyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  keyboardBehavior = "padding",
  className = "",
  contentContainerClassName = "",
  children,
  ...props
}: ScreenHeaderProps) {
  const baseClasses = "flex-1 bg-app dark:bg-neutral-900";
  const paddingClasses = withPadding ? "p-6" : "";

  let content = children;

  return (
    <View
      className={`${baseClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {content}
    </View>
  );
}
