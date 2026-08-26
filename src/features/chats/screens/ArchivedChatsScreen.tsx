import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

// Components
import { ChatItem } from "../components";

// Icons
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";

// Dummy Data
import { DUMMY_ARCHIVED_CHATS } from "@/constants/dummyData";

export function ArchivedChatsScreen() {
  const router = useRouter();

  const handleChatPress = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const renderItem = ({
    item,
  }: {
    item: (typeof DUMMY_ARCHIVED_CHATS)[0];
  }) => (
    <ChatItem
      {...item}
      avatarType={
        item.avatarType as "image" | "initials" | "group" | "archive" | undefined
      }
      onPress={() => handleChatPress(item.id)}
    />
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
          data={DUMMY_ARCHIVED_CHATS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          recycleItems={true}
        />
      </View>
    </ScreenContainer>
  );
}
