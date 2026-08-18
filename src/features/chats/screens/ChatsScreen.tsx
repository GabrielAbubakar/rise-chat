import { BaseText, ScreenHeader } from "@/shared/components";
import { useState } from "react";
import { View } from "react-native";
import { ChatSearchInput } from "../components";
import { useConversationsList } from "../hooks/useChats";

export function ChatsScreen() {
  const { data, isLoading, error } = useConversationsList();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader className="pt-10">
        <BaseText type="h1" className="text-white dark:text-white mb-6">
          Chats
        </BaseText>
        <ChatSearchInput value={searchQuery} onChangeText={setSearchQuery} />
      </ScreenHeader>

      <View className="flex-1 items-center justify-center">
        {isLoading && (
          <BaseText color="secondary" className="mt-2">
            Loading chats...
          </BaseText>
        )}
        {error && (
          <BaseText color="error" className="mt-2">
            Error: {error.message}
          </BaseText>
        )}
        {data && (
          <BaseText className="text-green-500 mt-2">
            Chats fetched successfully!
          </BaseText>
        )}
      </View>
    </View>
  );
}
