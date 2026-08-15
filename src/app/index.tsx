import { Redirect } from "expo-router";
import { useAppStore } from "@/store";

export default function Index() {
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  if (hasSeenOnboarding) {
    return <Redirect href="/(tabs)/chats" />;
  }
  
  return <Redirect href="/welcome" />;
}
