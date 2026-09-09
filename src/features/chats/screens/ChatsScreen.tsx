import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LegendList } from "@legendapp/list/react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { BackHandler, Pressable, RefreshControl, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

// Components
import {
  ChatFabMenu,
  ChatItem,
  ChatSearchInput,
  NewChatBottomSheet,
  NewGroupBottomSheet,
} from "../components";

// Icons
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import BookmarkIcon from "@/assets/icons/solid/bookmark.svg";
import TrashIcon from "@/assets/icons/solid/trash.svg";
import VolumeOffIcon from "@/assets/icons/solid/volume-off.svg";

// Dummy Data
import {
  useArchivedConversationsList,
  useConversationsList,
} from "../hooks/useChats";
import { ConversationResponseDto } from "../types";

export function ChatsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const newChatBottomSheetRef = useRef<BottomSheetModal>(null);
  const newGroupBottomSheetRef = useRef<BottomSheetModal>(null);
  const { data: conversations, refetch, isPending } = useConversationsList();
  const { data: archivedConversations } = useArchivedConversationsList();
  // const userID = useAuthStore((state) => state.user?.id);
  const displayConversations =
    conversations?.pages.flatMap((page) => page.items) || [];

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

  const renderItem = ({ item }: { item: ConversationResponseDto }) => (
    <ChatItem
      data={item}
      isSelected={selectedChats.has(item.id)}
      onPress={() => handleChatPress(item.id)}
      onLongPress={() => handleChatLongPress(item.id)}
    />
  );

  const renderHeader = () => {
    const archivedCount =
      archivedConversations?.pages.flatMap((page) => page.items).length || 0;

    return (
      <View className="mb-2">
        <Pressable
          onPress={() => router.push("/archived-chats")}
          className="flex-row items-center rounded-lg px-4 py-3 active:bg-primary-50 dark:active:bg-neutral-700 bg-app dark:bg-app-dark"
        >
          <View className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center">
            <ArchiveIcon
              width={24}
              height={24}
              color={isDark ? "white" : "black"}
            />
          </View>
          <View className="flex-1 flex-row justify-between ml-4">
            <BaseText
              type="body-lg"
              className="text-label dark:text-label-dark font-sf-bold"
            >
              Archived Chats
            </BaseText>

            <BaseText
              type="body-lg"
              numberOfLines={1}
              className="text-neutral-500 dark:text-neutral-300 mt-1"
            >
              {archivedCount} {archivedCount === 1 ? "chat" : "chats"}
            </BaseText>
          </View>
        </Pressable>
      </View>
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
          data={displayConversations}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          keyExtractor={(item) => item.id}
          extraData={selectedChats}
          estimatedItemSize={80}
          refreshControl={
            <RefreshControl
              refreshing={isPending}
              onRefresh={() => refetch()}
              tintColor="#ffffff"
            />
          }
          ItemSeparatorComponent={() => <View className="h-2" />}
          recycleItems={true}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <BaseText>No chats yet</BaseText>
            </View>
          }
          className="p-3"
          contentContainerClassName="pb-20"
        />
      </View>

      {/* Floating Action Button */}
      <ChatFabMenu
        onNewChatPress={handleNewChatPress}
        onNewGroupPress={handleNewGroupPress}
      />

      {/* Bottom Sheet */}
      <NewChatBottomSheet ref={newChatBottomSheetRef} />
      <NewGroupBottomSheet ref={newGroupBottomSheetRef} />
    </ScreenContainer>
  );
}
