import { useState, useEffect } from "react";
import { useRouter, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";

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
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (step > 1) {
        // Prevent default behavior of leaving the screen
        e.preventDefault();
        // Go back one step instead
        prevStep();
      }
    });

    return unsubscribe;
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

  const finishRegistration = () => {
    // submit logic here
    console.log({ phoneNumber, verificationCode, username, photoUri });
    // Go to next screen or complete auth
    // router.replace('/');
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
