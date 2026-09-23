import CameraIcon from "@/assets/icons/solid/camera.svg";
import UserIcon from "@/assets/icons/solid/user.svg";
import { mediaApi } from "@/features/media/api";
import {
  BaseButton,
  BaseInput,
  PhoneInput,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useGetMe, useSetAvatar, useUpdateMe } from "../hooks/useProfile";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function EditProfileScreen() {
  const router = useRouter();
  const { data: user } = useGetMe();
  const setAvatarMutation = useSetAvatar();

  const [name, setName] = useState(user?.displayName || "Roberto William");
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phoneNumber || "85830544382",
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { mutate: updateProfile, isPending } = useUpdateMe({
    onSuccess: (data) => {
      showSuccessToast("Profile updated successfully");
      router.back();
    },
    onError: (error) => {
      showApiErrorToast(error, "Failed to update profile");
    },
  });

  const handlePickAndUploadAvatar = async () => {
    try {
      // Step 1: Pick Image from gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setIsUploadingAvatar(true);
      const asset = result.assets[0];

      const fileName = asset.fileName || `avatar_${Date.now()}.jpg`;
      const mimeType = (asset.mimeType ||
        (asset.uri.endsWith(".png")
          ? "image/png"
          : asset.uri.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg")) as any;
      const sizeBytes = asset.fileSize || 500000;

      // Step 2: Authorize Upload (POST /v1/media/uploads)
      const uploadAuth = await mediaApi.createUpload({
        clientUploadId: generateUUID(),
        purpose: "profile_avatar",
        contentType: mimeType,
        sizeBytes: sizeBytes,
        originalFilename: fileName,
      });

      if (!uploadAuth.upload) {
        // Media asset was already uploaded/ready
        await setAvatarMutation.mutateAsync({ mediaId: uploadAuth.media.id });
        showSuccessToast("Profile picture updated successfully!");
        return;
      }

      // Step 3: Direct Multipart Transfer to Cloudinary (POST upload.url) via standalone axios
      const formData = new FormData();
      if (uploadAuth.upload.fields) {
        Object.entries(uploadAuth.upload.fields).forEach(([key, val]) => {
          formData.append(key, String(val));
        });
      }

      formData.append("file", {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);

      await axios.post(uploadAuth.upload.url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Step 4: Complete Upload Verification & Set Profile Avatar
      await mediaApi.completeUpload(uploadAuth.media.id);
      await setAvatarMutation.mutateAsync({ mediaId: uploadAuth.media.id });

      showSuccessToast("Profile picture updated successfully!");
    } catch (error: any) {
      console.log(error);
      showApiErrorToast(error, "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    updateProfile({ displayName: name });
  };

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      isKeyboardAvoiding
      isScrollable
      keyboardBehavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        className="pt-10 pb-24"
        title="Edit Profile"
        onBack={() => router.back()}
        useSafeArea
      />

      <View className="flex-1 px-6">
        {/* Avatar Section */}
        <View className="items-center -mt-20 mb-10 z-20">
          <TouchableOpacity
            className="relative"
            onPress={handlePickAndUploadAvatar}
            disabled={isUploadingAvatar}
            activeOpacity={0.8}
          >
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : require("@/assets/images/default-avatar.png")
              }
              className="w-32 h-32 rounded-full border-[4px] border-white bg-white"
              defaultSource={require("@/assets/images/default-avatar.png")}
            />
            {isUploadingAvatar ? (
              <View className="absolute inset-0 rounded-full bg-black/40 items-center justify-center border-[4px] border-white">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary items-center justify-center border-[4px] border-white">
                <CameraIcon width={20} height={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <BaseInput
          label="Name"
          value={name}
          onChangeText={setName}
          leftComponent={
            <View className="mr-3">
              <UserIcon width={24} height={24} color="#6E8597" />
            </View>
          }
        />

        <View className="mt-2">
          <PhoneInput
            label="Phone Number"
            value={phoneNumber}
            onChangePhoneNumber={(raw) => setPhoneNumber(raw)}
            defaultCountryCode="NG"
            disabled={true}
          />
        </View>
      </View>

      {/* Save Button */}
      <View className="p-6 pt-2 pb-8 bg-app dark:bg-app-dark">
        <BaseButton
          title={isPending ? "Saving..." : "Save"}
          onPress={handleSave}
          className="bg-primary"
          disabled={isPending || isUploadingAvatar}
        />
      </View>
    </ScreenContainer>
  );
}
