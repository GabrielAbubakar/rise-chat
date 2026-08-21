import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

// Components
import { ChatItem, ChatSearchInput } from "../components";

// Icons
import PlusIcon from "@/assets/icons/solid/plus.svg";

// Dummy Data
import { DUMMY_ARCHIVED_CHATS, DUMMY_CHATS } from "@/constants/dummyData";

export function ChatsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleChatPress = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const renderItem = ({ item }: { item: (typeof DUMMY_CHATS)[0] }) => (
    <ChatItem
      {...item}
      avatarType={
        item.avatarType as
          | "image"
          | "initials"
          | "group"
          | "archive"
          | undefined
      }
      onPress={() => handleChatPress(item.id)}
    />
  );

  const renderHeader = () => {
    if (DUMMY_ARCHIVED_CHATS.length === 0) return null;

    return (
      <ChatItem
        id="archived"
        name="Archived Chat"
        avatarType="archive"
        lastMessage={DUMMY_ARCHIVED_CHATS.map((c) => c.name).join(", ")}
        time={DUMMY_ARCHIVED_CHATS[0].time}
        unreadCount={0}
        isPinned={false}
        isActive={false}
        onPress={() => router.push("/archived-chats")}
      />
    );
  };

  return (
    <ScreenContainer
      className="flex-1 bg-app dark:bg-app-dark"
      withPadding={false}
      isSafeArea={false}
    >
      <ScreenHeader useSafeArea withPadding={false}>
        <View className="px-6 pb-4 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <BaseText
              type="h1"
              className="text-white dark:text-white font-sf-bold"
            >
              Chats
            </BaseText>
          </View>
          <ChatSearchInput value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </ScreenHeader>

      <View className="flex-1">
        <LegendList
          data={DUMMY_CHATS}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          recycleItems={true}
          className="pt-3"
        />
      </View>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-400 rounded-full items-center justify-center shadow-lg"
        onPress={() => {
          // Action for new chat
        }}
      >
        <PlusIcon width={24} height={24} fill="white" />
      </Pressable>
    </ScreenContainer>
  );
}
