import { tokenStorage } from "@/services/api/token";
import { showApiErrorToast } from "@/shared/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { queryClient } from "@/core/queryClient";
import { profileKeys } from "@/features/settings/hooks/useProfile";
import { useResendOtp, useVerifyOtp } from "./useAuth";
import { useTimer } from "./useTimer";

export function useOtpStep(
  challengeId: string,
  initialResendSeconds: number,
  onSuccess: (hasProfile: boolean) => void,
  onChallengeIdChanged?: (newChallengeId: string) => void,
) {
  const [currentChallengeId, setCurrentChallengeId] = useState(challengeId);
  const [verificationCode, setVerificationCode] = useState("");
  const [otpError, setOtpError] = useState(false);

  const [prevChallengeId, setPrevChallengeId] = useState(challengeId);

  if (challengeId !== prevChallengeId) {
    setPrevChallengeId(challengeId);
    setCurrentChallengeId(challengeId);
  }
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const { timeLeft, isActive, startTimer } = useTimer(initialResendSeconds);

  useEffect(() => {
    startTimer(initialResendSeconds);
  }, [initialResendSeconds, startTimer]);

  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp({
    onSuccess: async (data) => {
      setOtpError(false);
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      
      // Update React Query cache directly
      queryClient.setQueryData(profileKeys.me(), data.user);
      
      // Mark as authenticated in Zustand
      setAuthenticated(true);

      const hasProfile = Boolean(data.user.displayName && data.user.avatarUrl);
      onSuccess(hasProfile);
    },
    onError: (error) => {
      setOtpError(true);
      showApiErrorToast(
        error,
        "The OTP code you entered is incorrect.",
        "Verification Failed",
      );
    },
  });

  const { mutate: resendOtp, isPending: isResendingOtp } = useResendOtp({
    onSuccess: (data) => {
      startTimer(data.resendInSeconds);
      setOtpError(false);
      setVerificationCode("");
      setCurrentChallengeId(data.challengeId);
      if (onChallengeIdChanged) onChallengeIdChanged(data.challengeId);
    },
    onError: (error) => {
      showApiErrorToast(
        error,
        "An error occurred while trying to resend the code.",
        "Failed to Resend",
      );
    },
  });

  const handleVerify = () => {
    if (verificationCode.length >= 4) {
      verifyOtp({ challengeId: currentChallengeId, code: verificationCode });
    }
  };

  const handleResend = () => {
    if (!isActive && currentChallengeId) {
      resendOtp({ challengeId: currentChallengeId });
    }
  };

  const handleSetVerificationCode = (code: string) => {
    setVerificationCode(code);
    if (otpError && code.length > 0) {
      setOtpError(false);
    }
  };

  return {
    verificationCode,
    setVerificationCode: handleSetVerificationCode,
    isVerifyingOtp,
    isResendingOtp,
    otpError,
    timeLeft,
    isActive,
    handleVerify,
    handleResend,
  };
}
