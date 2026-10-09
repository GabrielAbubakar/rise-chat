import { ChatDetailScreen } from "@/features/chats/screens";
import { useLocalSearchParams } from "expo-router";

export default function ChatDetailRoute() {
  const params = useLocalSearchParams<{ id?: string; search?: string }>();
  return <ChatDetailScreen id={params.id} search={params.search} />;
}
