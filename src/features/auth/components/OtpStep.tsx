import { BaseButton, BaseText, OtpInput } from "@/shared/components";
import { Pressable, View } from "react-native";
import { useOtpStep } from "../hooks/useOtpStep";

interface OtpStepProps {
  challengeId: string;
  phoneNumber: string;
  initialResendSeconds: number;
  onSuccess: (hasProfile: boolean) => void;
  onChallengeIdChanged?: (newChallengeId: string) => void;
}

export function OtpStep({
  challengeId,
  phoneNumber,
  initialResendSeconds,
  onSuccess,
  onChallengeIdChanged,
}: OtpStepProps) {
  const {
    verificationCode,
    setVerificationCode,
    isVerifyingOtp,
    isResendingOtp,
    otpError,
    timeLeft,
    isActive,
    handleVerify,
    handleResend,
  } = useOtpStep(challengeId, initialResendSeconds, onSuccess, onChallengeIdChanged);

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
        isError={otpError}
      />

      {otpError && (
        <BaseText
          type="body-md"
          className="text-red-500 dark:text-red-500 mt-2 text-center"
        >
          Wrong OTP code. Please try again.
        </BaseText>
      )}

      <View className="items-center mt-8">
        <BaseText
          type="body-md"
          className="text-neutral-300 dark:text-neutral-300 mb-2"
        >
          {isActive
            ? `If you don't get the code, resend it in ${timeLeft} seconds.`
            : `Didn't get the code?`}
        </BaseText>
        <Pressable onPress={handleResend} disabled={isActive || isResendingOtp}>
          <BaseText
            type="body-md"
            color={isActive ? "primary50" : "primary"}
            className="font-bold"
          >
            {isResendingOtp ? "Resending..." : "Resend code"}
          </BaseText>
        </Pressable>
      </View>

      <View className="flex-1" />

      <BaseButton
        title="Verify"
        onPress={handleVerify}
        disabled={verificationCode.length < 4 || isVerifyingOtp}
        loading={isVerifyingOtp}
      />
    </View>
  );
}
