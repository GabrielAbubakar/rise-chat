import {
  BaseButton,
  BaseInput,
  BaseText,
  OtpInput,
  PhoneInput,
  ScreenContainer,
} from "@/shared/components";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Image, Pressable, View } from "react-native";

import { useRegisterFlow } from "../hooks/useRegisterFlow";

export function RegisterScreen() {
  // single responsibility hook leaving the screen as the View
  // and the hook as the ViewModel handling state
  const {
    step,
    phoneNumber,
    setPhoneNumber,
    isValidPhone,
    setIsValidPhone,
    verificationCode,
    setVerificationCode,
    username,
    setUsername,
    photoUri,
    nextStep,
    prevStep,
    pickImage,
    finishRegistration,
  } = useRegisterFlow();

  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View className="flex-1 pb-10">
            <BaseText type="h3" className="mb-3">
              What's your phone number?
            </BaseText>
            <BaseText
              type="body-md"
              className="mb-10 text-neutral-300 dark:text-neutral-300"
            >
              We will send you the verification code.
            </BaseText>
            <PhoneInput
              label="Phone Number"
              placeholder="(234) 813-054-3070"
              value={phoneNumber}
              onChangePhoneNumber={(formatted, isValid) => {
                setPhoneNumber(formatted);
                setIsValidPhone(isValid);
              }}
              autoFocus
            />

            {/* Spacer to push button to the bottom */}
            <View className="flex-1" />

            <BaseButton
              title="Next"
              onPress={nextStep}
              disabled={!isValidPhone}
            />
          </View>
        );
      case 2:
        return (
          <View className="flex-1 pb-10">
            <BaseText type="h3" className="mb-3">
              Verification code
            </BaseText>
            <BaseText
              type="body-md"
              className="mb-10 text-neutral-300 dark:text-neutral-300"
            >
              Enter the code number we sent to {phoneNumber}.
            </BaseText>

            <OtpInput
              value={verificationCode}
              onChangeText={setVerificationCode}
            />

            <View className="items-center mt-8">
              <BaseText
                type="body-md"
                className="text-neutral-300 dark:text-neutral-300 mb-2"
              >
                If you don't get the code, resend it in 24 seconds.
              </BaseText>
              <Pressable>
                <BaseText type="body-md" className="text-primary font-bold">
                  Resend code
                </BaseText>
              </Pressable>
            </View>

            <View className="flex-1" />

            <BaseButton
              title="Next"
              onPress={nextStep}
              disabled={verificationCode.length < 4}
            />
          </View>
        );
      case 3:
        return (
          <View className="flex-1 pb-10">
            <BaseText type="h3" className="mb-3">
              Whats your name?
            </BaseText>
            <BaseText
              type="body-md"
              className="mb-10 text-neutral-300 dark:text-neutral-300"
            >
              Write your name. You can change it back in settings.
            </BaseText>
            <BaseInput
              label="Name"
              placeholder="Name"
              autoCapitalize="words"
              value={username}
              onChangeText={setUsername}
              autoFocus
              leftComponent={
                <View className="mr-3 pl-3">
                  <Feather name="user" size={20} color="#9ca3af" />
                </View>
              }
            />

            <View className="flex-1" />

            <BaseButton
              title="Next"
              onPress={nextStep}
              disabled={username.length < 2}
            />
          </View>
        );
      case 4:
        return (
          <View className="flex-1 justify-center items-center w-full">
            <BaseText type="h2" className="mb-8 text-center text-white">
              Add a Profile Photo
            </BaseText>

            <Pressable onPress={pickImage} className="mb-10">
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  className="w-32 h-32 rounded-full border-4 border-primary"
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gray-800 items-center justify-center border-2 border-dashed border-gray-500">
                  <BaseText className="text-gray-400 text-4xl">+</BaseText>
                </View>
              )}
            </Pressable>

            <View className="w-full">
              <BaseButton
                title={photoUri ? "Complete Registration" : "Skip for now"}
                onPress={finishRegistration}
              />
              <Pressable className="mt-6 p-2 items-center" onPress={prevStep}>
                <BaseText className="text-gray-400">Back</BaseText>
              </Pressable>
            </View>
          </View>
        );
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
