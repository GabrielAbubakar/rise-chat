import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store";
import { useSecurityStore } from "@/store/useSecurityStore";
import { useSegments, useRouter } from "expo-router";
import { useEffect } from "react";

export function useProtectedRoute(isAppReady: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  
  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const isAppUnlocked = useSecurityStore((state) => state.isAppUnlocked);

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inWelcome = segments[0] === "welcome";
    const inUnlock = segments[0] === "unlock";
    const isProfileComplete = user?.profileComplete || !!user?.displayName;

    if (user) {
      if (isPinSet && !isAppUnlocked && !inUnlock) {
        // App is locked, redirect to unlock screen
        router.replace("/unlock");
        return;
      }

      if (isProfileComplete) {
        // Fully authenticated user trying to access login/welcome
        if (inAuthGroup || inWelcome || (!segments[0] && isAppUnlocked)) {
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
      if (segments[0] === "(tabs)" || inUnlock) {
        if (hasSeenOnboarding) {
          router.replace("/(auth)/register");
        } else {
          router.replace("/welcome");
        }
      }
    }
  }, [user, segments, isAppReady, router, hasSeenOnboarding, isPinSet, isAppUnlocked]);
}
