/* eslint-disable react-hooks/immutability */
import { ActivityIndicator, Pressable, PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { tv, type VariantProps } from "tailwind-variants";
import { useThemeColors } from "../hooks";
import { BaseText } from "./BaseText";

const buttonVariants = tv({
  base: "w-full items-center justify-center py-5 rounded-2xl",
  variants: {
    variant: {
      primary: "",
      secondary: "",
    },
    disabled: {
      true: "opacity-50",
    },
  },
  defaultVariants: {
    variant: "primary",
    disabled: false,
  },
});

const textVariants = tv({
  variants: {
    variant: {
      primary: "text-white dark:text-white",
      secondary: "",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

interface BaseButtonProps
  extends
    PressableProps,
    Omit<VariantProps<typeof buttonVariants>, "disabled"> {
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
  variant = "primary",
  className = "",
  animated,
  entering,
  exiting,
  layout,
  ...props
}: BaseButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const { primary, primaryShades } = useThemeColors();

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
          className={buttonVariants({
            variant,
            disabled: props.disabled || loading,
            className,
          })}
          style={{ backgroundColor: variant === "primary" ? primary : primaryShades[50] }}
          disabled={props.disabled || loading}
          {...props}
        >
          {loading ? (
            <ActivityIndicator
              color={variant === "primary" ? "white" : primary}
            />
          ) : (
            <BaseText 
              type="button-big" 
              className={textVariants({ variant })}
              style={variant === "secondary" ? { color: primary } : undefined}
            >
              {title}
            </BaseText>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
