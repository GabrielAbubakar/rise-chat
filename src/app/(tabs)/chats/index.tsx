import { ChatsScreen } from "@/features/chats/screens";
import { useSecurityStore } from "@/store/useSecurityStore";
import { Redirect } from "expo-router";

export default function ChatsRoute() {
  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const isAppUnlocked = useSecurityStore((state) => state.isAppUnlocked);

  if (isPinSet && !isAppUnlocked) {
    return <Redirect href="/unlock" />;
  }

  return <ChatsScreen />;
}
