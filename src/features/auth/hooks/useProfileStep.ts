import { MAX_MEDIA_SIZE_BYTES, uploadMedia } from "@/features/media/services";
import { useSetAvatar } from "@/features/settings/hooks/useProfile";
import { showApiErrorToast } from "@/shared/utils";
import { useAppStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useUpdateProfile } from "./useAuth";

export type AvatarStage =
  | "idle"
  | "selected"
  | "uploading"
  | "verified"
  | "saved"
  | "failed";

export interface SelectedPhotoAsset {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export function useProfileStep() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [photoAsset, setPhotoAsset] = useState<SelectedPhotoAsset | null>(null);
  const [avatarStage, setAvatarStage] = useState<AvatarStage>("idle");

  const setHasSeenOnboarding = useAppStore(
    (state) => state.setHasSeenOnboarding,
  );
  const setAvatarMutation = useSetAvatar();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_MEDIA_SIZE_BYTES) {
          showApiErrorToast(
            new Error("Image exceeds 50 MB limit"),
            "File Too Large",
          );
          return;
        }

        setPhotoAsset({
          uri: asset.uri,
          fileName: asset.fileName || `avatar_${Date.now()}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
          fileSize: asset.fileSize || undefined,
        });
        setAvatarStage("selected");
      }
    } catch (error: any) {
      showApiErrorToast(error, "Failed to pick image");
    }
  };

  const removePhoto = () => {
    setPhotoAsset(null);
    setAvatarStage("idle");
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

  const finishRegistration = async () => {
    try {
      if (photoAsset) {
        setAvatarStage("uploading");
        const mediaAsset = await uploadMedia({
          uri: photoAsset.uri,
          purpose: "profile_avatar",
          fileName: photoAsset.fileName,
          mimeType: photoAsset.mimeType,
          sizeBytes: photoAsset.fileSize,
        });

        setAvatarStage("verified");
        await setAvatarMutation.mutateAsync({ mediaId: mediaAsset.id });
        setAvatarStage("saved");
      }

      updateProfile({
        displayName: username || undefined,
      });
    } catch (error: any) {
      setAvatarStage(photoAsset ? "failed" : "idle");
      showApiErrorToast(error, "Failed to setup profile");
    }
  };

  const isBusy =
    isUpdatingProfile ||
    avatarStage === "uploading" ||
    avatarStage === "verified" ||
    setAvatarMutation.isPending;

  return {
    username,
    setUsername,
    photoUri: photoAsset?.uri || null,
    photoAsset,
    avatarStage,
    pickImage,
    removePhoto,
    isUpdatingProfile: isBusy,
    finishRegistration,
  };
}
