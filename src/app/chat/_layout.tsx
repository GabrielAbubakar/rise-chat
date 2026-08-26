import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="media" />
      <Stack.Screen name="qr" />
    </Stack>
  );
}

