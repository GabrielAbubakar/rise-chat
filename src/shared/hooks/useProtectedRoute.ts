import { useGetMe } from "@/features/settings/hooks/useProfile";
import { useAppStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { useSecurityStore } from "@/store/useSecurityStore";
import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import { useEffect } from "react";

const PUBLIC_SEGMENTS = ["(auth)", "welcome", "tokens"];

export function useProtectedRoute(isAppReady: boolean) {
  const segments = useSegments();
  const pathname = usePathname();
  const globalParams = useGlobalSearchParams();
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
    const isProfileComplete = user?.profileComplete || !!user?.displayName;

    // F10 FIX: Reconstruct concrete destination URL with actual parameters instead of dynamic placeholders ([id])
    let concretePath = pathname || "";
    if (concretePath.includes("[")) {
      Object.entries(globalParams).forEach(([key, val]) => {
        if (typeof val === "string" || typeof val === "number") {
          concretePath = concretePath
            .replace(`[${key}]`, String(val))
            .replace(`[...${key}]`, String(val));
        }
      });
    }

    if (concretePath && segments.length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(globalParams).forEach(([key, val]) => {
        const isSegmentParam = segments.some(
          (seg) => seg === `[${key}]` || seg === `[...${key}]`,
        );
        if (!isSegmentParam && val !== undefined && val !== null) {
          queryParams.append(key, String(val));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        concretePath = `${concretePath}?${queryString}`;
      }
    }

    const isPublicRoute =
      PUBLIC_SEGMENTS.includes(firstSegment) ||
      concretePath.startsWith("/welcome") ||
      concretePath.startsWith("/(auth)");

    const isValidDestination =
      concretePath &&
      !isPublicRoute &&
      concretePath !== "/unlock" &&
      concretePath !== "/" &&
      !concretePath.includes("[");

    if (isAuthenticated) {
      if (isPinSet && !isAppUnlocked) {
        if (!inUnlock) {
          // App is locked, save intended concrete destination if valid private screen
          if (isValidDestination) {
            setPendingRoute(concretePath);
          }
          router.replace("/unlock");
        }
        return;
      }

      // If we don't have the user data yet but we are authenticated, wait for hydration
      if (!user) return;

      if (isProfileComplete) {
        // Authenticated user trying to access public auth screens or unlock after being unlocked
        if (
          inAuthGroup ||
          inWelcome ||
          inUnlock ||
          (!firstSegment && isAppUnlocked)
        ) {
          // Guard: Discard any stale placeholder routes containing unparsed dynamic segments
          const destination =
            pendingRoute && !pendingRoute.includes("[")
              ? pendingRoute
              : "/(tabs)/chats";
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
        if (isValidDestination) {
          setPendingRoute(concretePath);
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
    pathname,
    globalParams,
    isAppReady,
    router,
    hasSeenOnboarding,
    isPinSet,
    isAppUnlocked,
    pendingRoute,
    setPendingRoute,
  ]);
}
