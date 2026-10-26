import { useGetMe } from "@/features/settings/hooks/useProfile";
import { useAppStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { useSecurityStore } from "@/store/useSecurityStore";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

const PUBLIC_SEGMENTS = ["(auth)", "welcome", "tokens"];

export function useProtectedRoute(isAppReady: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const pendingRoute = useAppStore((state) => state.pendingRoute);
  const setPendingRoute = useAppStore((state) => state.setPendingRoute);

  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const isAppUnlocked = useSecurityStore((state) => state.isAppUnlocked);

  // Fetch the user profile from React Query.
  // This will read from the persisted MMKV cache immediately on startup.
  const { data: user } = useGetMe({ enabled: isAuthenticated });

  useEffect(() => {
    if (!isAppReady) return;

    const firstSegment = segments[0] || "";
    const inAuthGroup = firstSegment === "(auth)";
    const inWelcome = firstSegment === "welcome";
    const inUnlock = firstSegment === "unlock";
    const isPublicRoute = PUBLIC_SEGMENTS.includes(firstSegment);
    const isProfileComplete = user?.profileComplete || !!user?.displayName;
    const attemptedPath = segments.length > 0 ? `/${segments.join("/")}` : "";

    if (isAuthenticated) {
      if (isPinSet && !isAppUnlocked) {
        if (!inUnlock) {
          // App is locked, save intended destination if valid private screen
          if (attemptedPath && !isPublicRoute && attemptedPath !== "/unlock") {
            setPendingRoute(attemptedPath);
          }
          router.replace("/unlock");
        }
        return;
      }

      // If we don't have the user data yet but we are authenticated, wait for hydration
      if (!user) return;

      if (isProfileComplete) {
        // Authenticated user trying to access public auth screens or unlock after being unlocked
        if (inAuthGroup || inWelcome || inUnlock || (!firstSegment && isAppUnlocked)) {
          const destination = pendingRoute || "/(tabs)/chats";
          if (pendingRoute) {
            setPendingRoute(null);
          }
          router.replace(destination as any);
        }
      } else {
        // Authenticated but profile not complete
        if (!inAuthGroup) {
          router.replace("/(auth)/register");
        }
      }
    } else {
      // Not authenticated: protect ALL non-public routes
      if (!isPublicRoute) {
        if (attemptedPath && attemptedPath !== "/unlock") {
          setPendingRoute(attemptedPath);
        }
        if (hasSeenOnboarding) {
          router.replace("/(auth)/register");
        } else {
          router.replace("/welcome");
        }
      }
    }
  }, [
    user,
    isAuthenticated,
    segments,
    isAppReady,
    router,
    hasSeenOnboarding,
    isPinSet,
    isAppUnlocked,
    pendingRoute,
    setPendingRoute,
  ]);
}
