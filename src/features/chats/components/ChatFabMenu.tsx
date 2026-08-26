import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

import { BaseText } from "@/shared/components";

// Icons
import ChatIcon from "@/assets/icons/solid/chat.svg";
import PlusIcon from "@/assets/icons/solid/plus.svg";
import UserIcon from "@/assets/icons/solid/user.svg";
import UsersIcon from "@/assets/icons/solid/users.svg";
import XIcon from "@/assets/icons/solid/x.svg";

type FabMenuItemProps = {
  label: string;
  icon: React.FC<any>;
  onPress: () => void;
  style: any;
  isLast?: boolean;
};

const FabMenuItem = ({
  label,
  icon: Icon,
  onPress,
  style,
  isLast,
}: FabMenuItemProps) => (
  <Animated.View style={style}>
    <Pressable
      className={`flex-row items-center w-44 bg-white dark:bg-neutral-800 p-4 gap-3  rounded-full shadow-lg ${
        isLast ? "" : "mb-3"
      }`}
      onPress={onPress}
    >
      <Icon width={20} height={20} color="#4ADE80" className="mr-3" />
      <BaseText className="text-neutral-900 dark:text-white font-sf-bold">
        {label}
      </BaseText>
    </Pressable>
  </Animated.View>
);

export function ChatFabMenu({
  onNewChatPress,
  onNewGroupPress,
}: {
  onNewChatPress?: () => void;
  onNewGroupPress?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);
  const router = useRouter();

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    animation.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  };

  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            animation.value,
            [0, 1],
            [0, 135], // Rotate 135 degrees to turn plus into cross nicely
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  });

  const plusIconStyle = useAnimatedStyle(() => ({
    position: "absolute",
    opacity: interpolate(
      animation.value,
      [0, 0.5, 1],
      [1, 0, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const xIconStyle = useAnimatedStyle(() => ({
    position: "absolute",
    opacity: interpolate(
      animation.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [{ rotate: "-135deg" }], // Counter rotate so it appears upright
  }));

  const overlayStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      opacity: animation.value, // direct binding to the spring
    };
  });

  const getMenuItemStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const translateY = interpolate(
        animation.value,
        [0, 1],
        [20 + index * 10, 0],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        animation.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const scale = interpolate(
        animation.value,
        [0, 1],
        [0.8, 1],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
        transform: [{ translateY }, { scale }],
      };
    });
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 10 }]}
      pointerEvents="box-none"
    >
      {/* Dimming Backdrop Overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, overlayStyle]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
      </Animated.View>

      <View
        className="absolute bottom-6 right-6 items-end justify-end"
        pointerEvents="box-none"
      >
        {/* Floating Action Menu Items */}
        <View
          className="mb-4 items-end"
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <FabMenuItem
            label="New Chat"
            icon={ChatIcon}
            style={getMenuItemStyle(2)}
            onPress={() => {
              toggleMenu();
              onNewChatPress?.();
            }}
          />
          <FabMenuItem
            label="New Contact"
            icon={UserIcon}
            style={getMenuItemStyle(1)}
            onPress={() => {
              toggleMenu();
              router.push("/new-contact");
            }}
          />
          <FabMenuItem
            label="New Group"
            icon={UsersIcon}
            style={getMenuItemStyle(0)}
            onPress={() => {
              toggleMenu();
              onNewGroupPress?.();
            }}
            isLast
          />
        </View>

        {/* Main FAB */}
        <Pressable onPress={toggleMenu}>
          <Animated.View
            className="w-14 h-14 bg-primary-400 rounded-full items-center justify-center shadow-lg"
            style={fabStyle}
          >
            <Animated.View style={plusIconStyle}>
              <PlusIcon width={24} height={24} color="white" />
            </Animated.View>
            <Animated.View style={xIconStyle}>
              <XIcon width={24} height={24} color="white" />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}
