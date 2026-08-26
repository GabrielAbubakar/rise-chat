import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PinKeypad } from "@/features/security/components/PinKeypad";
import { savePinCode } from "@/services/security/pin";
import { useSecurityStore } from "@/store/useSecurityStore";
import Toast from "react-native-toast-message";
import { colors } from "@/shared/constants/tokens";
import { ScreenContainer, BaseText } from "@/shared/components";
import { useColorScheme } from "nativewind";

export default function SetupPinScreen() {
  const router = useRouter();
  const setPinStatus = useSecurityStore((state) => state.setPinStatus);
  const setAppUnlocked = useSecurityStore((state) => state.setAppUnlocked);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleDigitPress = async (digit: string) => {
    if (step === "create") {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep("confirm"), 300);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 4) {
          if (newConfirmPin === pin) {
            // PIN matched, save it
            await savePinCode(pin);
            setPinStatus(true);
            setAppUnlocked(true);
            Toast.show({
              type: "success",
              text1: "PIN code set up successfully",
            });
            router.replace("/(tabs)/chats");
          } else {
            // PIN didn't match, reset
            Toast.show({
              type: "error",
              text1: "PINs do not match. Try again.",
            });
            setConfirmPin("");
            setPin("");
            setStep("create");
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === "create") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const currentPinLength = step === "create" ? pin.length : confirmPin.length;

  return (
    <ScreenContainer withPadding={false}>
      <View className="px-5 pt-5 pb-2">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full justify-center items-center bg-surface dark:bg-surface-dark shadow-sm shadow-black/10 elevation-2"
        >
          <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#111827"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center px-6 pt-10">
        <BaseText type="h3" className="mb-3">
          {step === "create" ? "Setup pin code" : "Confirm pin code"}
        </BaseText>
        <BaseText type="body-md" color="secondary" className="text-center mb-10">
          Make sure the code is safe and no one else knows.
        </BaseText>

        <View className="flex-row gap-4">
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              className={`w-4 h-4 rounded-full ${
                index < currentPinLength 
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
