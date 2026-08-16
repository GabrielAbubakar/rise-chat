import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BaseText, BaseInput, BaseButton } from '@/shared/components';
import { useProfileStep } from '../hooks/useProfileStep';

interface ProfileStepProps {
  step: number;
  nextStep: () => void;
  prevStep: () => void;
}

export function ProfileStep({ step, nextStep, prevStep }: ProfileStepProps) {
  const {
    username,
    setUsername,
    photoUri,
    pickImage,
    isUpdatingProfile,
    finishRegistration,
  } = useProfileStep();

  if (step === 3) {
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
  }

  if (step === 4) {
    return (
      <View className="flex-1 justify-center items-center w-full">
        <BaseText type="h2" className="mb-8 text-center text-white">
          Add a Profile Photo
        </BaseText>

        <Pressable onPress={pickImage} className="mb-10" disabled={isUpdatingProfile}>
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
            loading={isUpdatingProfile}
            disabled={isUpdatingProfile}
          />
          <Pressable className="mt-6 p-2 items-center" onPress={prevStep}>
            <BaseText className="text-gray-400">Back</BaseText>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}
