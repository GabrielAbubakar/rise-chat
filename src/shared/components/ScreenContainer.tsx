import React from "react";
import { ScrollView, View, ViewProps } from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

export interface ScreenContainerProps extends ViewProps {
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
export function ScreenContainer({
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
}: ScreenContainerProps) {
  const baseClasses = "flex-1 bg-app dark:bg-neutral-900";
  const paddingClasses = withPadding ? "p-6" : "";

  const Container = isSafeArea ? SafeAreaView : View;

  let content = children;

  if (isScrollable) {
    if (isKeyboardAvoiding) {
      content = (
        <>
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName={`${paddingClasses} ${contentContainerClassName}`}
            keyboardShouldPersistTaps="handled"
            bottomOffset={80} // Offset to ensure input scrolls past the KeyboardToolbar
          >
            {content}
          </KeyboardAwareScrollView>
          <KeyboardToolbar />
        </>
      );
    } else {
      content = (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName={`${paddingClasses} ${contentContainerClassName}`}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      );
    }
  } else if (isKeyboardAvoiding) {
    // Wrap with padding inner view if avoiding keyboard without scroll
    content = <View className={`flex-1 ${paddingClasses}`}>{content}</View>;
    content = (
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={{ flex: 1 }}
      >
        {content}
        <KeyboardToolbar />
      </KeyboardAvoidingView>
    );
  }

  // Only apply padding directly to container if neither scrollable nor keyboard avoiding
  const containerPadding =
    !isScrollable && !isKeyboardAvoiding ? paddingClasses : "";

  return (
    <Container
      className={`${baseClasses} ${containerPadding} ${className}`}
      {...(isSafeArea ? { edges: ["top", "bottom"] } : {})}
      {...props}
    >
      {content}
    </Container>
  );
}
