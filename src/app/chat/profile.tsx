import { useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "@/features/chats/screens";

export default function ProfileRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <ProfileScreen id={params.id} />;
}
