import { showApiErrorToast, generateUUID } from "@/shared/utils";
import { useAppStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import axios from "axios";
import { mediaApi } from "@/features/media/api";
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

  const [isUploading, setIsUploading] = useState(false);

  const finishRegistration = async () => {
    try {
      let finalAvatarUrl: string | undefined = undefined;

      if (photoUri) {
        setIsUploading(true);
        const name = `avatar_${Date.now()}.jpg`;
        const type = "image/jpeg";
        const size = 500000; // rough estimate

        const uploadAuth = await mediaApi.createUpload({
          clientUploadId: generateUUID(),
          purpose: "profile_avatar",
          contentType: type,
          sizeBytes: size,
          originalFilename: name,
        });

        if (uploadAuth.upload) {
          const formData = new FormData();
          if (uploadAuth.upload.fields) {
            Object.entries(uploadAuth.upload.fields).forEach(([key, val]) => {
              formData.append(key, String(val));
            });
          }

          formData.append("file", {
            uri: photoUri,
            name: name,
            type: type,
          } as any);

          await axios.post(uploadAuth.upload.url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const completedMedia = await mediaApi.completeUpload(uploadAuth.media.id);
          finalAvatarUrl = completedMedia.secureUrl || undefined;
        }
      }

      updateProfile({
        displayName: username || undefined,
        avatarUrl: finalAvatarUrl,
      });
    } catch (error: any) {
      showApiErrorToast(error, "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    username,
    setUsername,
    photoUri,
    pickImage,
    isUpdatingProfile: isUpdatingProfile || isUploading,
    finishRegistration,
  };
}
