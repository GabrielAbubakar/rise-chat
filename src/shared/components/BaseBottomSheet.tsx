import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { BackHandler, Keyboard } from "react-native";
import { colors } from "../constants";
export interface BaseBottomSheetProps extends Omit<
  BottomSheetModalProps,
  "children"
> {
  children: React.ReactNode | ((props: any) => React.ReactNode);
  /**
   * Optional custom handler for hardware back press.
   * Return true to indicate the event was handled and prevent the default behavior (dismissing the sheet).
   * Return false to let the sheet dismiss normally.
   */
  onHardwareBackPress?: () => boolean;
}

export const BaseBottomSheet = forwardRef<
  BottomSheetModal,
  BaseBottomSheetProps
>(({ children, onHardwareBackPress, onChange, ...rest }, ref) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (onHardwareBackPress) {
          const handled = onHardwareBackPress();
          if (handled) return true; // custom logic handled it, do not dismiss
        }

        // Default behavior: dismiss the sheet
        if (ref && typeof ref === "object" && ref.current) {
          ref.current.dismiss();
        }
        return true; // prevent default react-navigation back action
      },
    );

    return () => subscription.remove();
  }, [isOpen, onHardwareBackPress, ref]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  const handleSheetChanges = useCallback(
    (...args: Parameters<NonNullable<BottomSheetModalProps["onChange"]>>) => {
      const index = args[0];
      setIsOpen(index >= 0);

      if (index < 0) {
        Keyboard.dismiss();
      }

      if (onChange) {
        onChange(...args);
      }
    },
    [onChange],
  );

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? colors.neutral[700] : "#ffffff",
        borderRadius: 24,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#374151" : "#D1D5DB",
        width: 40,
      }}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleSheetChanges}
      {...rest}
    >
      {children}
    </BottomSheetModal>
  );
});

BaseBottomSheet.displayName = "BaseBottomSheet";
