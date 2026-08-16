import { useAppStore } from "@/store";
import { useAuthStore } from "@/store/useAuthStore";
import { Redirect } from "expo-router";

export default function Index() {
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const user = useAuthStore((state) => state.user);

  if (user) {
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
