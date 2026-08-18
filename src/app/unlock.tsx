import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { PinKeypad } from "@/features/security/components/PinKeypad";
import { verifyPinCode } from "@/services/security/pin";
import { useSecurityStore } from "@/store/useSecurityStore";
import Toast from "react-native-toast-message";
import LockIcon from "@/assets/icons/solid/lock-closed.svg";
import { colors } from "@/shared/constants/tokens";
import { ScreenContainer, BaseText } from "@/shared/components";

export default function UnlockScreen() {
  const router = useRouter();
  const setAppUnlocked = useSecurityStore((state) => state.setAppUnlocked);
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDigitPress = async (digit: string) => {
    if (pin.length < 4 && !isVerifying) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsVerifying(true);
        const isValid = await verifyPinCode(newPin);
        
        if (isValid) {
          setAppUnlocked(true);
          router.replace("/(tabs)/chats");
        } else {
          Toast.show({
            type: "error",
            text1: "Incorrect PIN. Try again.",
          });
          setPin("");
          setIsVerifying(false);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (!isVerifying) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <View className="flex-1 items-center px-6 pt-20">
        <View className="w-16 h-16 rounded-full justify-center items-center mb-6 bg-[#ECFDF5] dark:bg-neutral-700 shadow-sm shadow-black/10 elevation-3">
          <LockIcon width={32} height={32} color={colors.primary.DEFAULT} />
        </View>
        <BaseText type="h3" className="mb-3">Unlock App</BaseText>
        <BaseText type="body-md" color="secondary" className="text-center mb-10">
          Enter your PIN code to access your chats.
        </BaseText>

        <View className="flex-row gap-4">
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              className={`w-4 h-4 rounded-full ${
                index < pin.length 
                  ? "bg-primary" 
                  : "border-[1.5px] border-[#D1D5DB] dark:border-neutral-700 bg-transparent"
              }`}
            />
          ))}
        </View>

        {/* Spacer to push keypad to the bottom */}
        <View className="flex-1" />

        <View className="w-full pb-8">
          <PinKeypad onPressDigit={handleDigitPress} onPressBackspace={handleBackspace} />
        </View>
      </View>
    </ScreenContainer>
  );
}
