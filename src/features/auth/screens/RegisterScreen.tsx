import {
  BaseButton,
  BaseInput,
  BaseText,
  ScreenContainer,
} from "@/shared/components";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

export function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [username, setUsername] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const finishRegistration = () => {
    // submit logic here
    console.log({ phoneNumber, verificationCode, username, photoUri });
    // Go to next screen or complete auth
    // router.replace('/');
  };

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
              className="mb-3 text-neutral-300 dark:text-neutral-300"
            >
              We will send you the verification code.
            </BaseText>
            <BaseInput
              label="Phone Number"
              keyboardType="phone-pad"
              placeholder="(555) 555-5555"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
            />

            {/* Spacer to push button to the bottom */}
            <View className="flex-1" />

            <BaseButton
              title="Next"
              onPress={nextStep}
              disabled={phoneNumber.length < 5}
            />
          </View>
        );
      case 2:
        return (
          <View className="flex-1 justify-center">
            <BaseText type="h2" className="mb-6">
              Verification Code
            </BaseText>
            <BaseText
              type="body-sm"
              className="mb-8 text-neutral-300 dark:text-neutral-300"
            >
              Sent to {phoneNumber}
            </BaseText>
            <BaseInput
              size="large"
              keyboardType="number-pad"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
              autoFocus
            />
            <BaseButton
              title="Verify"
              onPress={nextStep}
              disabled={verificationCode.length < 4}
            />
            <Pressable className="mt-6 p-2 items-center" onPress={prevStep}>
              <BaseText className="text-gray-400">
                Back to Phone Number
              </BaseText>
            </Pressable>
          </View>
        );
      case 3:
        return (
          <View className="flex-1 justify-center">
            <BaseText type="h2" className="mb-6 text-center text-white">
              Pick a Username
            </BaseText>
            <BaseInput
              placeholder="@username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              autoFocus
            />
            <BaseButton
              title="Next"
              onPress={nextStep}
              disabled={username.length < 3}
            />
            <Pressable className="mt-6 p-2 items-center" onPress={prevStep}>
              <BaseText className="text-gray-400">Back</BaseText>
            </Pressable>
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
      <View className="flex-1 px-8 mt-20">{renderStep()}</View>
    </ScreenContainer>
  );
}
