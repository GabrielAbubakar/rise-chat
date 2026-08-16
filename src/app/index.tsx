import { useAppStore } from "@/store";
import { Redirect } from "expo-router";

export default function Index() {
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  if (hasSeenOnboarding) {
    return <Redirect href="/(auth)/register" />;
  }

  return <Redirect href="/welcome" />;
}
