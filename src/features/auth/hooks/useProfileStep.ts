import { showApiErrorToast } from "@/shared/utils";
import { useAppStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useUpdateProfile } from "./useAuth";

export function useProfileStep() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const setHasSeenOnboarding = useAppStore(
    (state) => state.setHasSeenOnboarding,
  );

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

  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile({
      onSuccess: () => {
        setHasSeenOnboarding(true);
        router.replace("/(tabs)/chats");
      },
      onError: (error) => {
        showApiErrorToast(error, "Failed to save profile", "Update Failed");
      },
    });

  const finishRegistration = () => {
    updateProfile({
      displayName: username || undefined,
      // avatarUrl: photoUri || undefined,
    });
  };

  return {
    username,
    setUsername,
    photoUri,
    pickImage,
    isUpdatingProfile,
    finishRegistration,
  };
}
