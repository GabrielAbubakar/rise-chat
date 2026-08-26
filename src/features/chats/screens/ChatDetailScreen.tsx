import {
  Avatar,
  BaseText,
  BaseTouchableOpacity,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import ChevronDownIcon from "@/assets/icons/solid/cheveron-down.svg";
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";
import ChevronUpIcon from "@/assets/icons/solid/cheveron-up.svg";
import PlaneIcon from "@/assets/icons/solid/paper-airplane.svg";
import PaperClipIcon from "@/assets/icons/solid/paper-clip.svg";
import PhoneIcon from "@/assets/icons/solid/phone.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import VideoIcon from "@/assets/icons/solid/video-camera.svg";

// Dummy Data
import { DUMMY_CHATS, DUMMY_MESSAGES } from "@/constants/dummyData";
import { MessagePill } from "../components";

const { height: windowHeight } = Dimensions.get("window");

export interface ChatDetailScreenProps {
  id?: string;
  search?: string;
}

export function ChatDetailScreen({ id, search }: ChatDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [message, setMessage] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const listRef = useRef<any>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Search feature states
  const [isSearching, setIsSearching] = useState(search === "true");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    if (search === "true") {
      setIsSearching(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 250);
    }
  }, [search]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    setIsAtBottom(isBottom);
  };

  // Use dummy chat info
  const chat = DUMMY_CHATS.find((c) => c.id === id) || DUMMY_CHATS[0];

  // Calculate matching messages for search
  const matchingIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const indices: number[] = [];
    DUMMY_MESSAGES.forEach((item, index) => {
      if (item.text.toLowerCase().includes(query)) {
        indices.push(index);
      }
    });
    return indices;
  }, [searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
    if (matchingIndices.length > 0) {
      listRef.current?.scrollToIndex({
        index: matchingIndices[0],
        animated: true,
      });
    }
  }, [searchQuery, matchingIndices]);

  const handlePrevMatch = () => {
    if (matchingIndices.length === 0) return;
    const nextIdx =
      currentMatchIndex > 0 ? currentMatchIndex - 1 : matchingIndices.length - 1;
    setCurrentMatchIndex(nextIdx);
    listRef.current?.scrollToIndex({
      index: matchingIndices[nextIdx],
      animated: true,
    });
  };

  const handleNextMatch = () => {
    if (matchingIndices.length === 0) return;
    const nextIdx =
      currentMatchIndex < matchingIndices.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(nextIdx);
    listRef.current?.scrollToIndex({
      index: matchingIndices[nextIdx],
      animated: true,
    });
  };

  const handleExitSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: (typeof DUMMY_MESSAGES)[0];
    index: number;
  }) => {
    const isCurrentMatch =
      isSearching &&
      matchingIndices.length > 0 &&
      matchingIndices[currentMatchIndex] === index;

    return (
      <MessagePill
        isMe={item.isMe}
        text={item.text}
        time={item.time}
        searchQuery={isSearching ? searchQuery : undefined}
        isCurrentMatch={isCurrentMatch}
      />
    );
  };

  return (
    <ScreenContainer
      isKeyboardAvoiding
      withPadding={false}
      isSafeArea={false}
      keyboardBehavior={Platform.select({
        ios: "padding",
        android: "height",
      })}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      {/* Header */}
      <ScreenHeader
        useSafeArea
        withPadding={false}
        className="z-10 shadow-sm pt-4"
      >
        {isSearching ? (
          /* Search Header Bar */
          <View className="flex-row items-center justify-between px-4 pb-4 pt-2 gap-3">
            <View className="flex-1 flex-row items-center bg-black/15 dark:bg-neutral-700/80 rounded-full px-3 py-2 border border-white/20 dark:border-neutral-600">
              <SearchIcon width={20} height={20} color="white" />
              <TextInput
                ref={searchInputRef}
                className="flex-1 text-white font-sf-regular ml-2 text-base py-0"
                placeholder="Search in chat..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} className="p-1">
                  <BaseText className="text-white/80 font-sf-bold text-xs">
                    ✕
                  </BaseText>
                </Pressable>
              )}
            </View>
            <Pressable onPress={handleExitSearch} className="px-2 py-1">
              <BaseText className="text-white font-sf-medium text-base">
                Cancel
              </BaseText>
            </Pressable>
          </View>
        ) : (
          /* Default Chat Header */
          <View className="flex-row items-center justify-between px-4 pb-4 pt-2">
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => router.back()} className="p-1">
                <ArrowLeftIcon width={28} height={28} color="white" />
              </Pressable>

              <BaseTouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/chat/profile",
                    params: { id: chat.id },
                  })
                }
                className="flex-row items-center flex-1"
              >
                <Avatar
                  type={(chat.avatarType as any) || "image"}
                  source={chat.avatar}
                  initials={chat.initials}
                  backgroundColor={chat.avatarColor}
                  size={40}
                  className="ml-2"
                />

                <View className="ml-3 flex-1 justify-center">
                  <BaseText className="text-white text-[18px] font-sf-bold">
                    {chat.name}
                  </BaseText>
                  <BaseText type="body-md" className="text-white/80 mt-0.5">
                    {chat.lastSeen || "Active 5 minutes ago"}
                  </BaseText>
                </View>
              </BaseTouchableOpacity>
            </View>

            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => {
                  setIsSearching(true);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className="p-1"
              >
                <SearchIcon width={24} height={24} color="white" />
              </Pressable>
              <Pressable className="p-1">
                <VideoIcon width={26} height={26} color="white" />
              </Pressable>
              <Pressable className="p-1">
                <PhoneIcon width={24} height={24} color="white" />
              </Pressable>
            </View>
          </View>
        )}
      </ScreenHeader>

      {/* Messages List */}
      <View className="flex-1 overflow-hidden">
        <Image
          source={
            isDark
              ? require("@/assets/images/chat-background-dark.png")
              : require("@/assets/images/chat-background-light.png")
          }
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: windowHeight,
          }}
          resizeMode="cover"
        />
        <LegendList
          ref={listRef}
          data={DUMMY_MESSAGES}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          estimatedItemSize={60}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          recycleItems={true}
        />
      </View>

      {/* Search match navigator bar above bottom input */}
      {isSearching && searchQuery.trim().length > 0 && (
        <View className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-2 flex-row items-center justify-between">
          <BaseText className="text-neutral-900 dark:text-white font-sf-medium text-sm">
            {matchingIndices.length > 0
              ? `${currentMatchIndex + 1} from ${matchingIndices.length}`
              : "0 results"}
          </BaseText>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handlePrevMatch}
              disabled={matchingIndices.length === 0}
              className={`p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 ${
                matchingIndices.length === 0 ? "opacity-40" : "active:bg-neutral-200 dark:active:bg-neutral-600"
              }`}
            >
              <ChevronUpIcon width={18} height={18} color={isDark ? "white" : "#3A566A"} />
            </Pressable>
            <Pressable
              onPress={handleNextMatch}
              disabled={matchingIndices.length === 0}
              className={`p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 ${
                matchingIndices.length === 0 ? "opacity-40" : "active:bg-neutral-200 dark:active:bg-neutral-600"
              }`}
            >
              <ChevronDownIcon width={18} height={18} color={isDark ? "white" : "#3A566A"} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Scroll to bottom button */}
      {isKeyboardVisible && !isAtBottom && !isSearching && (
        <Pressable
          className="absolute right-4 bg-primary-400 dark:bg-primary-500 rounded-full w-10 h-10 items-center justify-center shadow-lg z-20"
          style={{ bottom: Math.max(insets.bottom, 12) + 70 }}
          onPress={() => {
            listRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <ChevronDownIcon width={24} height={24} color="white" />
        </Pressable>
      )}

      {/* Input Area (only shown when not searching) */}
      {!isSearching && (
        <View
          className="bg-transparent px-4 py-3 flex-row items-end"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1 flex-row items-end bg-app dark:bg-neutral-700 rounded-[24px] px-4 py-2 border border-divider dark:border-neutral-600">
            <Pressable className="mr-3 mb-[14px]">
              <PaperClipIcon
                width={20}
                height={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </Pressable>
            <TextInput
              className="flex-1 text-label dark:text-label-dark font-sf-regular py-3 max-h-[120px]"
              placeholder="Type your message..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Pressable
              className="w-12 h-12 bg-primary-400 rounded-full items-center justify-center ml-3"
              onPress={() => {
                // Send action
                if (message.trim()) setMessage("");
              }}
            >
              <PlaneIcon width={24} height={24} color="white" />
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

