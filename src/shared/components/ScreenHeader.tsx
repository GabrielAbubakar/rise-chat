import ChevronLeftIcon from "@/assets/icons/solid/cheveron-left.svg";
import { Image } from "expo-image";
import React from "react";
import { Pressable, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BaseText } from "./BaseText";

export interface ScreenHeaderProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  useSafeArea?: boolean;
  title?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export function ScreenHeader({
  children,
  className = "",
  withPadding = true,
  useSafeArea = false,
  title,
  onBack,
  rightComponent,
  ...props
}: ScreenHeaderProps) {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container
      {...(useSafeArea ? { edges: ["top"] } : {})}
      className={`bg-primary-400 dark:bg-neutral-700 overflow-hidden ${className}`}
      {...props}
    >
      <Image
        source={require("@/assets/images/blur-tr.png")}
        className="absolute top-0 right-0 w-[200px] h-[200px] opacity-80 pointer-events-none"
        contentFit="contain"
      />
      <View className={withPadding ? "px-6 pt-2" : ""}>
        {(title || onBack || rightComponent) && (
          <View className="flex-row items-center justify-between mb-4">
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={10}
                className="w-10 h-10 items-start justify-center"
              >
                <ChevronLeftIcon width={24} height={24} color="white" />
              </Pressable>
            ) : (
              <View className="w-10 h-10" />
            )}

            {title && (
              <BaseText className="text-white font-sf-bold text-xl">
                {title}
              </BaseText>
            )}

            {rightComponent ? (
              <View className="w-10 h-10 items-end justify-center">
                {rightComponent}
              </View>
            ) : (
              <View className="w-10 h-10" />
            )}
          </View>
        )}
        {children}
      </View>
    </Container>
  );
}
