import { useState, useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { BackHandler } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';

export function useRegisterFlow() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  
  // If we already have a user, it means they completed OTP but not profile (otherwise they wouldn't be here)
  const initialStep = user && (!user.profileComplete && !user.displayName) ? 3 : 1;
  const [step, setStep] = useState(initialStep);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const jumpToStep = (newStep: number) => setStep(newStep);

  useEffect(() => {
    // 1. Handle React Navigation (e.g., header back button)
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (e.data.action.type === 'GO_BACK' && step > 1) {
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

  return {
    step,
    nextStep,
    prevStep,
    jumpToStep,
    phoneNumber,
    setPhoneNumber,
    challengeId,
    setChallengeId,
    resendSeconds,
    setResendSeconds,
  };
}
