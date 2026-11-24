import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BaseText } from "@/shared/components";

export function TypingIndicator() {
  const dot1 = useSharedValue(1);
  const dot2 = useSharedValue(1);
  const dot3 = useSharedValue(1);

  useEffect(() => {
    const animateDot = (delayStart: number) => {
      return withDelay(
        delayStart,
        withRepeat(
          withSequence(
            withTiming(1.6, { duration: 250 }),
            withTiming(1, { duration: 250 }),
            withTiming(1, { duration: 500 }) // Delay at the end of the loop
          ),
          -1,
          false
        )
      );
    };

    dot1.value = animateDot(0);
    dot2.value = animateDot(150);
    dot3.value = animateDot(300);
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: dot1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: dot2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ scale: dot3.value }],
  }));

  return (
    <View className="flex-row items-center mt-1">
      <BaseText type="body-md" className="text-white/80 mr-1 italic">
        typing
      </BaseText>
      <View className="flex-row items-center" style={{ height: 16 }}>
        <Animated.View
          className="w-1 h-1 rounded-full bg-white/80 mx-[1.5px]"
          style={style1}
        />
        <Animated.View
          className="w-1 h-1 rounded-full bg-white/80 mx-[1.5px]"
          style={style2}
        />
        <Animated.View
          className="w-1 h-1 rounded-full bg-white/80 mx-[1.5px]"
          style={style3}
        />
      </View>
    </View>
  );
}
