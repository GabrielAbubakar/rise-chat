import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, useRef } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

// Components
import { ChatFabMenu, ChatItem, ChatSearchInput, NewChatBottomSheet, NewGroupBottomSheet } from "../components";

// Icons
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import BookmarkIcon from "@/assets/icons/solid/bookmark.svg";
import PlusIcon from "@/assets/icons/solid/plus.svg";
import TrashIcon from "@/assets/icons/solid/trash.svg";
import VolumeOffIcon from "@/assets/icons/solid/volume-off.svg";

// Dummy Data
import { DUMMY_ARCHIVED_CHATS, DUMMY_CHATS } from "@/constants/dummyData";

export function ChatsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const newChatBottomSheetRef = useRef<BottomSheetModal>(null);
  const newGroupBottomSheetRef = useRef<BottomSheetModal>(null);

  const handleNewChatPress = () => {
    newChatBottomSheetRef.current?.present();
  };

  const handleNewGroupPress = () => {
    newGroupBottomSheetRef.current?.present();
  };

  const handleChatPress = (id: string) => {
    if (selectedChats.size > 0) {
      handleChatLongPress(id);
    } else {
      router.push(`/chat/${id}`);
    }
  };

  const handleChatLongPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedChats.size > 0) {
          setSelectedChats(new Set());
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, [selectedChats.size]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedChats(new Set());
      };
    }, []),
  );

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
      isSelected={selectedChats.has(item.id)}
      onPress={() => handleChatPress(item.id)}
      onLongPress={() => handleChatLongPress(item.id)}
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
              Chats{selectedChats.size > 0 ? ` • ${selectedChats.size}` : ""}
            </BaseText>

            {selectedChats.size > 0 && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="flex-row items-center gap-x-4"
              >
                <Pressable>
                  <BookmarkIcon width={24} height={24} color="white" />
                </Pressable>
                <Pressable>
                  <ArchiveIcon width={24} height={24} color="white" />
                </Pressable>
                <Pressable>
                  <VolumeOffIcon width={24} height={24} color="white" />
                </Pressable>
                <Pressable onPress={() => setSelectedChats(new Set())}>
                  <TrashIcon width={24} height={24} color="white" />
                </Pressable>
              </Animated.View>
            )}
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
          extraData={selectedChats}
          estimatedItemSize={80}
          ItemSeparatorComponent={() => <View className="h-2" />}
          recycleItems={true}
          className="p-3"
        />
      </View>

      {/* Floating Action Button */}
      <ChatFabMenu onNewChatPress={handleNewChatPress} onNewGroupPress={handleNewGroupPress} />
      
      {/* Bottom Sheet */}
      <NewChatBottomSheet ref={newChatBottomSheetRef} />
      <NewGroupBottomSheet ref={newGroupBottomSheetRef} />
    </ScreenContainer>
  );
}
