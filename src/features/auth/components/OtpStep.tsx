import { BaseButton, BaseText, OtpInput } from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";
import { Pressable, View } from "react-native";
import { useOtpStep } from "../hooks/useOtpStep";

interface OtpStepProps {
  challengeId: string;
  phoneNumber: string;
  initialResendSeconds: number;
  codeLength?: number;
  onSuccess: (hasProfile: boolean) => void;
  onChallengeIdChanged?: (newChallengeId: string) => void;
  onCodeLengthChanged?: (newLength: number) => void;
}

export function OtpStep({
  challengeId,
  phoneNumber,
  initialResendSeconds,
  codeLength: passedCodeLength = 4,
  onSuccess,
  onChallengeIdChanged,
  onCodeLengthChanged,
}: OtpStepProps) {
  const {
    verificationCode,
    setVerificationCode,
    isVerifyingOtp,
    isResendingOtp,
    otpError,
    timeLeft,
    isActive,
    codeLength: effectiveCodeLength,
    handleVerify,
    handleResend,
  } = useOtpStep(
    challengeId,
    initialResendSeconds,
    onSuccess,
    onChallengeIdChanged,
    passedCodeLength,
    onCodeLengthChanged,
  );
  const { primary } = useThemeColors();

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
        length={effectiveCodeLength}
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
            style={{ color: primary, opacity: isActive ? 0.5 : 1 }}
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
        disabled={
          verificationCode.length < effectiveCodeLength || isVerifyingOtp
        }
        loading={isVerifyingOtp}
      />
    </View>
  );
}
