import { BaseButton, BaseInput, BaseText } from "@/shared/components";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Image, Pressable, View } from "react-native";
import { useProfileStep } from "../hooks/useProfileStep";
import UploadPhotoDark from "@/assets/images/upload-photo-dark.svg";
import UploadPhotoLight from "@/assets/images/upload-photo-light.svg";

interface ProfileStepProps {
  step: number;
  nextStep: () => void;
  prevStep: () => void;
}

export function ProfileStep({ step, nextStep, prevStep }: ProfileStepProps) {
  const { colorScheme } = useColorScheme();
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
      <View className="flex-1 w-full">
        <BaseText
          type="h2"
          align="center"
          className="text-black dark:text-white mt-4"
        >
          Upload a photo
        </BaseText>

        <View className="flex-1 justify-center items-center">
          {photoUri ? (
            <View className="items-center">
              <View className="relative">
                <Image
                  source={{ uri: photoUri }}
                  className="w-32 h-32 rounded-full"
                />
                <View className="absolute -right-2 -top-2 bg-primary rounded-full w-10 h-10 items-center justify-center border-4 border-app dark:border-app-dark">
                  <Feather name="check" size={20} color="white" />
                </View>
              </View>
              <BaseText className="text-center mt-6 text-neutral-400 dark:text-neutral-400 font-medium">
                Done! Your photo{"\n"}successfully uploaded
              </BaseText>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              disabled={isUpdatingProfile}
              className="items-center"
            >
              {colorScheme === "dark" ? (
                <UploadPhotoDark width={192} height={192} />
              ) : (
                <UploadPhotoLight width={192} height={192} />
              )}
            </Pressable>
          )}
        </View>

        <View className="w-full pb-10">
          {photoUri ? (
            <BaseButton
              title="Next"
              onPress={finishRegistration}
              loading={isUpdatingProfile}
              disabled={isUpdatingProfile}
            />
          ) : (
            <>
              <BaseButton
                title="Upload Photo"
                onPress={pickImage}
                disabled={isUpdatingProfile}
              />
            </>
          )}
        </View>
      </View>
    );
  }

  return null;
}
