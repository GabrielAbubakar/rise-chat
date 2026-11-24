import CameraIcon from "@/assets/icons/solid/camera.svg";
import UserIcon from "@/assets/icons/solid/user.svg";
import { uploadMedia } from "@/features/media/services";
import {
  BaseButton,
  BaseInput,
  PhoneInput,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
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

export function EditProfileScreen() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const setAvatarMutation = useSetAvatar();

  // Derived state pattern: track user input without cascading effect re-renders
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const name = nameInput ?? user?.displayName ?? "";
  const phoneNumber = user?.phoneNumber ?? "";

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

      // Step 2: Upload via shared media upload service
      const mediaAsset = await uploadMedia({
        uri: asset.uri,
        purpose: "profile_avatar",
        fileName: asset.fileName || undefined,
        mimeType: asset.mimeType || undefined,
        sizeBytes: asset.fileSize || undefined,
      });

      // Step 3: Destination operation: assign avatar to user profile
      await setAvatarMutation.mutateAsync({ mediaId: mediaAsset.id });

      showSuccessToast("Profile picture updated successfully!");
    } catch (error: any) {
      console.log(error);
      showApiErrorToast(error, "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile({ displayName: name.trim() });
  };

  if (isUserLoading && !user) {
    return (
      <ScreenContainer className="flex-1 bg-app dark:bg-app-dark items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </ScreenContainer>
    );
  }

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
          onChangeText={setNameInput}
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
            onChangePhoneNumber={() => {}}
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
