import React from 'react';
import { View } from 'react-native';
import { BaseText, PhoneInput, BaseButton } from '@/shared/components';
import { usePhoneStep } from '../hooks/usePhoneStep';

interface PhoneStepProps {
  onSuccess: (challengeId: string, resendInSeconds: number, phoneNumber: string) => void;
}

export function PhoneStep({ onSuccess }: PhoneStepProps) {
  const {
    phoneNumber,
    setPhoneNumber,
    setFullPhoneNumber,
    isValidPhone,
    setIsValidPhone,
    isRequestingOtp,
    handleNext,
  } = usePhoneStep(onSuccess);

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
        onChangePhoneNumber={(raw, full, isValid) => {
          setPhoneNumber(raw);
          setFullPhoneNumber(full);
          setIsValidPhone(isValid);
        }}
        autoFocus
      />

      {/* Spacer to push button to the bottom */}
      <View className="flex-1" />

      <BaseButton
        title="Next"
        onPress={handleNext}
        disabled={!isValidPhone || isRequestingOtp}
        loading={isRequestingOtp}
      />
    </View>
  );
}
