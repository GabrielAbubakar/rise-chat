import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store";
import { useSecurityStore } from "@/store/useSecurityStore";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import { useSegments, useRouter } from "expo-router";
import { useEffect } from "react";

export function useProtectedRoute(isAppReady: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  
  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const isAppUnlocked = useSecurityStore((state) => state.isAppUnlocked);

  // Fetch the user profile from React Query.
  // This will read from the persisted MMKV cache immediately on startup.
  const { data: user } = useGetMe({ enabled: isAuthenticated });

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inWelcome = segments[0] === "welcome";
    const inUnlock = segments[0] === "unlock";
    const isProfileComplete = user?.profileComplete || !!user?.displayName;

    if (isAuthenticated) {
      if (isPinSet && !isAppUnlocked && !inUnlock) {
        // App is locked, redirect to unlock screen
        router.replace("/unlock");
        return;
      }

      // If we don't have the user data yet but we are authenticated, just wait
      // React query should hydrate this almost instantly from mmkv
      if (!user) return;

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
  }, [user, isAuthenticated, segments, isAppReady, router, hasSeenOnboarding, isPinSet, isAppUnlocked]);
}
