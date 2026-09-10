import CameraIcon from "@/assets/icons/solid/camera.svg";
import UserIcon from "@/assets/icons/solid/user.svg";
import {
  BaseButton,
  BaseInput,
  PhoneInput,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useGetMe, useUpdateMe } from "../hooks/useProfile";

export function EditProfileScreen() {
  const router = useRouter();
  const { data: user } = useGetMe();

  const [name, setName] = useState(user?.displayName || "Roberto William");
  // In the real app, value might be just the raw number, but let's prepopulate it to match the UI if empty
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phoneNumber || "85830544382",
  );

  const { mutate: updateProfile, isPending } = useUpdateMe({
    onSuccess: (data) => {
      showSuccessToast("Profile updated successfully");
      router.back();
    },
    onError: (error) => {
      showApiErrorToast(error, "Failed to update profile");
    },
  });

  const handleSave = () => {
    updateProfile({ displayName: name });
  };

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      isKeyboardAvoiding
      keyboardBehavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        className="pt-10 pb-24"
        title="Edit Profile"
        onBack={() => router.back()}
        useSafeArea
      />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View className="items-center -mt-20 mb-10 z-10">
          <View className="relative">
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : require("@/assets/images/default-avatar.png")
              }
              className="w-32 h-32 rounded-full border-[4px] border-white bg-white"
              defaultSource={require("@/assets/images/default-avatar.png")}
            />
            <TouchableOpacity className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary items-center justify-center border-[4px] border-white">
              <CameraIcon width={20} height={20} color="white" />
            </TouchableOpacity>
          </View>
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
            defaultCountryCode="ID" // Assuming ID for +62 based on +62 85-830-544-382
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="p-6 pt-2 pb-8 bg-app dark:bg-app-dark">
        <BaseButton
          title={isPending ? "Saving..." : "Save"}
          onPress={handleSave}
          className="bg-primary"
          disabled={isPending}
        />
      </View>
    </ScreenContainer>
  );
}
