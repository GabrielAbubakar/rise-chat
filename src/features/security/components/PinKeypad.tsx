import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { BaseText } from "@/shared/components";
import BackspaceIcon from "@/assets/icons/backspace.svg";
import * as Haptics from "expo-haptics";

interface PinKeypadProps {
  onPressDigit: (digit: string) => void;
  onPressBackspace: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({ onPressDigit, onPressBackspace }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ];

  const handleDigitPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressDigit(key);
  };

  const handleBackspacePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressBackspace();
  };

  return (
    <View className="w-full max-w-[320px] self-center mt-10">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-5">
          {row.map((key) => {
            if (key === "") {
              return <View key={`empty-${rowIndex}`} className="w-[70px] h-[70px]" />;
            }
            if (key === "backspace") {
              return (
                <TouchableOpacity
                  key={key}
                  className="w-[70px] h-[70px] rounded-[35px] justify-center items-center bg-surface dark:bg-surface-dark shadow-sm shadow-black/10 elevation-3"
                  onPress={handleBackspacePress}
                  activeOpacity={0.7}
                >
                  <BackspaceIcon width={24} height={24} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={key}
                className="w-[70px] h-[70px] rounded-[35px] justify-center items-center bg-surface dark:bg-surface-dark shadow-sm shadow-black/10 elevation-3"
                onPress={() => handleDigitPress(key)}
                activeOpacity={0.7}
              >
                <BaseText type="h3">{key}</BaseText>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};
