import { useState } from "react";
import { useRequestOtp } from "./useAuth";

import Toast from "react-native-toast-message";
import { showApiErrorToast } from "@/shared/utils";

export function usePhoneStep(
  onSuccess: (
    challengeId: string,
    resendInSeconds: number,
    phoneNumber: string,
  ) => void,
) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);

  const { mutate: requestOtp, isPending: isRequestingOtp } = useRequestOtp({
    onSuccess: (data) => {
      onSuccess(data.challengeId, data.resendInSeconds, fullPhoneNumber);
    },
    onError: (error) => {
      showApiErrorToast(
        error,
        "Could not send verification code. Please check your number.",
        "Request Failed"
      );
    },
  });

  const handleNext = () => {
    if (isValidPhone) {
      // Backend expects the formatted E.164 phone number
      requestOtp({ phoneNumber: fullPhoneNumber });
    }
  };

  return {
    phoneNumber,
    setPhoneNumber,
    fullPhoneNumber,
    setFullPhoneNumber,
    isValidPhone,
    setIsValidPhone,
    isRequestingOtp,
    handleNext,
  };
}
