import { useLogout } from "@/features/auth/hooks/useAuth";
import { tokenStorage } from "@/services/api/token";
import { BaseButton } from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
import { useSecurityStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { Text, View } from "react-native";

export function SettingsScreen() {
  const { mutate: logoutApi, isPending } = useLogout({
    onSettled: async () => {
      // Regardless of whether the API succeeded or failed (e.g. offline),
      // we must clear the local session and redirect out.
      await useAuthStore.getState().logout();
    },
    onSuccess: () => {
      showSuccessToast("Logged out successfully");
    },
    onError: (error) => {
      showApiErrorToast(error, "Failed to logout from server");
    },
  });

  const handleLogout = async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      logoutApi({ refreshToken });
    } else {
      // If there's no refresh token locally for some reason, just force local logout
      await useAuthStore.getState().logout();
      useSecurityStore.getState().reset();
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-app dark:bg-app-dark px-6">
      <Text className="text-black dark:text-white text-2xl font-bold mb-10">
        Settings
      </Text>

      <View className="w-full">
        <BaseButton
          title="Log Out"
          onPress={handleLogout}
          loading={isPending}
          disabled={isPending}
        />
      </View>
    </View>
  );
}
