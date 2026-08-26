import { useLocalSearchParams } from "expo-router";
import { ChatDetailScreen } from "@/features/chats/screens";

export default function ChatDetailRoute() {
  const params = useLocalSearchParams<{ id?: string; search?: string }>();
  return <ChatDetailScreen id={params.id} search={params.search} />;
}
