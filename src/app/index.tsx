import { useAppStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import { Redirect } from "expo-router";

export default function Index() {
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: user } = useGetMe({ enabled: isAuthenticated });

  if (isAuthenticated) {
    if (!user) return null; // Wait for React Query to hydrate

    if (user.profileComplete || user.displayName) {
      return <Redirect href="/(tabs)/chats" />;
    } else {
      return <Redirect href="/(auth)/register" />;
    }
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(auth)/register" />;
  }

  return <Redirect href="/welcome" />;
}
