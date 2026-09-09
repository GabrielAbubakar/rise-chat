import { forwardRef } from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";

export type BaseTouchableOpacityProps = TouchableOpacityProps;

export const BaseTouchableOpacity = forwardRef<View, BaseTouchableOpacityProps>(
  ({ className = "", activeOpacity = 0.7, ...props }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        className={className}
        activeOpacity={activeOpacity}
        {...props}
      />
    );
  },
);

BaseTouchableOpacity.displayName = "BaseTouchableOpacity";
