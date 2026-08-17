import { Text, View } from "react-native";
import { useConversationsList } from "../hooks/useChats";

export function ChatsScreen() {
  const { data, isLoading, error } = useConversationsList();

  return (
    <View className="flex-1 items-center justify-center bg-app dark:bg-app-dark">
      <Text className="text-black dark:text-white text-2xl font-bold">
        Chats
      </Text>
      {isLoading && (
        <Text className="text-neutral-500 mt-2">Loading chats...</Text>
      )}
      {error && (
        <Text className="text-red-500 mt-2">Error: {error.message}</Text>
      )}
      {data && (
        <Text className="text-green-500 mt-2">Chats fetched successfully!</Text>
      )}
    </View>
  );
}
