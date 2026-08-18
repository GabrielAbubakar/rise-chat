import { ScreenContainer } from "@/shared/components";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Pressable, View } from "react-native";
import { useRegisterFlow } from "../hooks/useRegisterFlow";
import { PhoneStep, OtpStep, ProfileStep } from "../components";

import { useRouter } from "expo-router";

export function RegisterScreen() {
  const router = useRouter();
  const {
    step,
    nextStep,
    prevStep,
    challengeId,
    setChallengeId,
    resendSeconds,
    setResendSeconds,
    jumpToStep,
    phoneNumber,
    setPhoneNumber,
  } = useRegisterFlow();

  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PhoneStep
            onSuccess={(newChallengeId, newResendSeconds, passedPhone) => {
              setChallengeId(newChallengeId);
              setResendSeconds(newResendSeconds);
              setPhoneNumber(passedPhone);
              nextStep();
            }}
          />
        );
      case 2:
        return (
          <OtpStep
            challengeId={challengeId}
            phoneNumber={phoneNumber}
            initialResendSeconds={resendSeconds}
            onChallengeIdChanged={setChallengeId}
            onSuccess={(hasProfile) => {
              if (hasProfile) {
                // If profile is already complete, redirect to chats
                router.replace("/(tabs)/chats");
              } else {
                nextStep(); // Go to Profile step
              }
            }}
          />
        );
      case 3:
      case 4:
        return <ProfileStep step={step} nextStep={nextStep} prevStep={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={true}
      isKeyboardAvoiding={true}
    >
      <View className="flex-1 px-8 pt-4">
        {step > 1 && (
          <Pressable
            onPress={prevStep}
            className="w-12 h-12 rounded-full border border-divider dark:border-divider-dark items-center justify-center mb-6"
          >
            <Feather name="chevron-left" size={24} color={iconColor} />
          </Pressable>
        )}
        <View className={`flex-1 ${step === 1 ? "mt-20" : ""}`}>
          {renderStep()}
        </View>
      </View>
    </ScreenContainer>
  );
}
