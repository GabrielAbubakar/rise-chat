import { useLocalSearchParams } from "expo-router";
import { ChatMediaScreen } from "@/features/chats/screens";

export default function ChatMediaRoute() {
  const params = useLocalSearchParams<{
    id?: string;
    initialTab?: string;
  }>();

  return <ChatMediaScreen id={params.id} initialTab={params.initialTab} />;
}
