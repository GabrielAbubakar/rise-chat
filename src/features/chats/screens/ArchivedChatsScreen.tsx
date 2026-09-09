import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, View } from "react-native";

// Components
import { ChatItem } from "../components";

// Icons
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";

// API
import { useArchivedConversationsList } from "../hooks/useChats";
import { ConversationResponseDto } from "../types";

export function ArchivedChatsScreen() {
  const router = useRouter();
  
  const { data: conversations, isPending, refetch } = useArchivedConversationsList();
  const displayConversations = conversations?.pages.flatMap((page) => page.items) || [];

  const handleChatPress = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const renderItem = ({ item }: { item: ConversationResponseDto }) => (
    <ChatItem data={item} onPress={() => handleChatPress(item.id)} />
  );

  return (
    <ScreenContainer
      className="flex-1 bg-app dark:bg-app-dark"
      withPadding={false}
      isSafeArea={false}
    >
      <ScreenHeader useSafeArea withPadding={false} className="shadow-sm">
        <View className="px-4 pb-4 pt-4 flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 mr-2">
            <ArrowLeftIcon width={24} height={24} color="white" />
          </Pressable>
          <View className="flex-1 items-center mr-8">
            <BaseText className="text-white text-[18px] font-sf-bold">
              Archived Chat
            </BaseText>
          </View>
        </View>
      </ScreenHeader>

      <View className="flex-1">
        <LegendList
          data={displayConversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          recycleItems={true}
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshControl={
            <RefreshControl
              refreshing={isPending}
              onRefresh={() => refetch()}
              tintColor="#ffffff"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8 mt-10">
              <BaseText className="text-neutral-500 text-center">
                No archived chats available
              </BaseText>
            </View>
          }
          className="p-3"
        />
      </View>
    </ScreenContainer>
  );
}
