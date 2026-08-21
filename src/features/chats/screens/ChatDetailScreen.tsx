import {
  Avatar,
  BaseText,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { LegendList } from "@legendapp/list/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
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
import PlaneIcon from "@/assets/icons/solid/paper-airplane.svg";
import PaperClipIcon from "@/assets/icons/solid/paper-clip.svg";
import PhoneIcon from "@/assets/icons/solid/phone.svg";
import VideoIcon from "@/assets/icons/solid/video-camera.svg";

// Dummy Data
import { DUMMY_CHATS, DUMMY_MESSAGES } from "@/constants/dummyData";
import { MessagePill } from "../components";

const { height: windowHeight } = Dimensions.get("window");

export function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [message, setMessage] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const listRef = useRef<any>(null);

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

  const renderMessage = ({ item }: { item: (typeof DUMMY_MESSAGES)[0] }) => {
    return <MessagePill isMe={item.isMe} text={item.text} time={item.time} />;
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
        <View className="flex-row items-center justify-between px-4 pb-4 pt-2">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <ArrowLeftIcon width={28} height={28} color="white" />
            </Pressable>

            <Avatar
              type={chat.avatarType as any}
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
                Active 5 minutes ago
              </BaseText>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <Pressable>
              <VideoIcon width={28} height={28} color="white" />
            </Pressable>
            <Pressable>
              <PhoneIcon width={28} height={28} color="white" />
            </Pressable>
          </View>
        </View>
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

      {/* Scroll to bottom button */}
      {isKeyboardVisible && !isAtBottom && (
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

      {/* Input Area */}
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
    </ScreenContainer>
  );
}
