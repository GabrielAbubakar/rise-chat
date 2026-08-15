import {
  ActivityIndicator,
  Pressable,
  PressableProps,
} from "react-native";
import { BaseText } from "./BaseText";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface BaseButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  animated?: boolean;
  entering?: any;
  exiting?: any;
  layout?: any;
}

export function BaseButton({
  title,
  loading,
  className = "",
  animated,
  entering,
  exiting,
  layout,
  ...props
}: BaseButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    // wrapper to handle the entering, exiting, and layout animation
    <Animated.View
      className="w-full"
      entering={animated ? entering : undefined}
      exiting={animated ? exiting : undefined}
      layout={animated ? layout : undefined}
    >
      {/* This is a wrapper to handle the press in/out animation */}
      <Animated.View style={animatedStyle} className="w-full">
        <Pressable
          onPressIn={() => {
            scale.value = withSpring(0.95, { damping: 18, stiffness: 200 });
            opacity.value = withSpring(0.8);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 18, stiffness: 200 });
            opacity.value = withSpring(1);
          }}
          className={`w-full bg-primary items-center justify-center py-4 rounded-2xl ${
            props.disabled ? "opacity-50" : ""
          } ${className}`}
          disabled={props.disabled || loading}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <BaseText type="button-big" className="text-white">
              {title}
            </BaseText>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
