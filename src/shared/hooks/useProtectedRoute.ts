import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store";
import { useSegments, useRouter } from "expo-router";
import { useEffect } from "react";

export function useProtectedRoute(isAppReady: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inWelcome = segments[0] === "welcome";
    const isProfileComplete = user?.profileComplete || !!user?.displayName;

    if (user) {
      if (isProfileComplete) {
        // Fully authenticated user trying to access login/welcome
        if (inAuthGroup || inWelcome || !segments[0]) {
          router.replace("/(tabs)/chats");
        }
      } else {
        // Authenticated but profile not complete
        if (!inAuthGroup) {
          router.replace("/(auth)/register");
        }
      }
    } else {
      // Not authenticated, trying to access protected route (tabs)
      if (segments[0] === "(tabs)") {
        if (hasSeenOnboarding) {
          router.replace("/(auth)/register");
        } else {
          router.replace("/welcome");
        }
      }
    }
  }, [user, segments, isAppReady, router, hasSeenOnboarding]);
}
