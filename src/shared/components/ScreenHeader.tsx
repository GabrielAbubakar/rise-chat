import { Image } from "expo-image";
import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface ScreenHeaderProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  useSafeArea?: boolean;
}

export function ScreenHeader({
  children,
  className = "",
  withPadding = true,
  useSafeArea = false,
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
        className="absolute top-0 right-0 w-[200px] h-[200px] opacity-80"
        contentFit="contain"
      />
      <View className={withPadding ? "px-6 pt-2 pb-5" : ""}>
        {children}
      </View>
    </Container>
  );
}
