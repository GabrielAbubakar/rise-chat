import { useAppStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler } from "react-native";

export function useRegisterFlow() {
  const router = useRouter();
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [username, setUsername] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  useEffect(() => {
    // 1. Handle React Navigation (e.g., header back button)
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (step > 1) {
        e.preventDefault();
        prevStep();
      }
    });

    // 2. Handle Android Hardware Back / Gesture
    const onHardwareBackPress = () => {
      if (step > 1) {
        prevStep();
        return true; // Prevents the app from closing
      }
      return false; // Allows the app to close if on step 1
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBackPress
    );

    return () => {
      unsubscribe();
      backHandler.remove();
    };
  }, [navigation, step]);

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

  const setHasSeenOnboarding = useAppStore(
    (state) => state.setHasSeenOnboarding,
  );

  const finishRegistration = () => {
    console.log({ phoneNumber, verificationCode, username, photoUri });

    // Mark that the user has completed onboarding
    setHasSeenOnboarding(true);

    // Navigate to tabs
    router.replace("/(tabs)/chats");
  };

  return {
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
  };
}
