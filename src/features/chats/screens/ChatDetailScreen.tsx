import { useGetMe } from "@/features/settings/hooks/useProfile";
import { ScreenContainer } from "@/shared/components";
import { isSameDay, showInfoToast } from "@/shared/utils";
import { LegendList } from "@legendapp/list/react-native";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChevronDownIcon from "@/assets/icons/solid/cheveron-down.svg";

import {
  AttachmentPickerMenu,
  AttachmentPreviewBar,
  ChatHeader,
  ChatInputBar,
  ChatMessageItem,
  ChatSearchNavigator,
} from "../components";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { useChatSearch } from "../hooks/useChatSearch";
import {
  useConversationDetail,
  useConversationMessages,
  useMarkRead,
  useSendMessage,
} from "../hooks/useChats";
import { useSendChatMessage } from "../hooks/useSendChatMessage";
import { MessageResponseDto } from "../types";

const { height: windowHeight } = Dimensions.get("window");

export interface ChatDetailScreenProps {
  id?: string;
  search?: string;
}

export function ChatDetailScreen({ id, search }: ChatDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const { data: user } = useGetMe();
  const conversationId = id || "";

  // API Hooks
  const { data: conversationDetail } = useConversationDetail(conversationId, {
    enabled: !!conversationId,
  });

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationMessages(conversationId);

  const sendMessageMutation = useSendMessage(conversationId);
  const { mutate: markRead } = useMarkRead(conversationId);

  // Mark messages as read when opening the chat
  useEffect(() => {
    if (conversationId) {
      markRead();
    }
  }, [conversationId, markRead]);

  // WebSocket Hook (incoming messages, presence, typing indicators)
  const { isOtherOnline, isOtherTyping, sendTypingStart, sendTypingStop } =
    useChatRealtime(conversationId);

  // Flatten and sort messages oldest first
  const messages = useMemo(() => {
    if (!messagesData) return [];
    const allMessages = messagesData.pages.flatMap((page) => page.items);
    const sorted = [...allMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sorted.map((msg, index) => {
      const prevMessage = index > 0 ? sorted[index - 1] : null;
      const showDateSeparator =
        !prevMessage ||
        !isSameDay(new Date(msg.createdAt), new Date(prevMessage.createdAt));
      return { ...msg, showDateSeparator };
    });
  }, [messagesData]);

  // Local UI State
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Message Sending Hook
  const {
    message,
    setMessage,
    selectedAttachment,
    setSelectedAttachment,
    isUploadingAttachment,
    handleSendMessage,
  } = useSendChatMessage({
    conversationId,
    sendMessageMutation,
    sendTypingStop,
    onMessageSent: () => {
      // Give the list a brief moment to process the optimistic update, then scroll down
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Attachment Handlers
  const handleSelectAttachment = useCallback(
    (uri: string, fileName?: string, mimeType?: string, fileSize?: number) => {
      setSelectedAttachment({
        uri,
        fileName,
        mimeType,
        fileSize,
      });
    },
    [setSelectedAttachment],
  );

  const handlePickPhotoOrGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSelectAttachment(
          asset.uri,
          asset.fileName || undefined,
          asset.mimeType || undefined,
          asset.fileSize || undefined,
        );
      }
    } catch (error) {
      console.log("Error picking from gallery:", error);
    }
  }, [handleSelectAttachment]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        handleSelectAttachment(
          doc.uri,
          doc.name,
          doc.mimeType || undefined,
          doc.size || undefined,
        );
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  }, [handleSelectAttachment]);

  const handlePickLocation = useCallback(() => {
    showInfoToast("Location sharing selected");
  }, []);

  const handlePickContact = useCallback(() => {
    showInfoToast("Contact sharing selected");
  }, []);

  // Refs
  const listRef = useRef<any>(null);
  const searchInputRef = useRef<TextInput>(null);
  const composerRef = useRef<View>(null);


  // Scroll to index helper for search
  const handleScrollToIndex = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  // Search Hook
  const {
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchingIndices,
    handlePrevMatch,
    handleNextMatch,
    handleExitSearch,
  } = useChatSearch({
    messages,
    initialSearching: search === "true",
    onScrollToIndex: handleScrollToIndex,
  });

  useEffect(() => {
    if (search === "true") {
      setTimeout(() => searchInputRef.current?.focus(), 250);
    }
  }, [search]);

  // Keyboard visibility listener
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

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 100;
      const isBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;
      setIsAtBottom(isBottom);
    },
    [],
  );

  const isDirect = conversationDetail?.type === "direct";
  const otherParticipant = isDirect
    ? conversationDetail?.otherParticipant
    : null;
  const participantName =
    (isDirect ? otherParticipant?.displayName : conversationDetail?.name) ||
    "Chat";
  const participantAvatar =
    (isDirect ? otherParticipant?.avatarUrl : conversationDetail?.avatarUrl) ||
    undefined;
  const participantInitials = participantName
    ? participantName.charAt(0).toUpperCase()
    : "?";

  const handleTextChange = useCallback(
    (text: string) => {
      setMessage(text);
      if (text.length > 0) {
        sendTypingStart();
      } else {
        sendTypingStop();
      }
    },
    [setMessage, sendTypingStart, sendTypingStop],
  );

  const renderMessage = useCallback(
    ({
      item,
      index,
    }: {
      item: MessageResponseDto & { showDateSeparator?: boolean };
      index: number;
    }) => {
      const isCurrentMatch =
        isSearching &&
        matchingIndices.length > 0 &&
        matchingIndices[currentMatchIndex] === index;

      return (
        <ChatMessageItem
          item={item}
          isMe={item.senderId === user?.id}
          isCurrentMatch={isCurrentMatch}
          searchQuery={isSearching ? searchQuery : undefined}
          showDateSeparator={item.showDateSeparator ?? false}
        />
      );
    },
    [user?.id, isSearching, matchingIndices, currentMatchIndex, searchQuery],
  );

  // console.log(messages);

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
      <ChatHeader
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onExitSearch={handleExitSearch}
        onStartSearch={() => {
          setIsSearching(true);
          setTimeout(() => searchInputRef.current?.focus(), 150);
        }}
        participantName={participantName}
        participantAvatar={participantAvatar}
        participantInitials={participantInitials}
        isOtherOnline={isOtherOnline}
        isOtherTyping={isOtherTyping}
        conversationId={conversationId}
        searchInputRef={searchInputRef}
        isGroup={conversationDetail?.type === "group"}
      />

      {/* Messages List */}
      <View className="flex-1 overflow-hidden">
        <Image
          source={
            isDark
              ? require("@/assets/images/chat-background-dark.png")
              : require("@/assets/images/chat-background-light.png")
          }
          style={styles.backgroundImage}
          contentFit="cover"
        />
        {isMessagesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ADE80" />
          </View>
        ) : (
          <LegendList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id || item.clientMessageId}
            estimatedItemSize={60}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            recycleItems={true}
            alignItemsAtEnd={true}
            initialScrollAtEnd={true}
            maintainScrollAtEnd={true}
            maintainScrollAtEndThreshold={0.1}
            maintainVisibleContentPosition={true}
            onStartReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onStartReachedThreshold={0.5}
          />
        )}
      </View>

      {/* Search Match Navigator */}
      {isSearching && searchQuery.trim().length > 0 ? (
        <ChatSearchNavigator
          totalMatches={matchingIndices.length}
          currentMatchIndex={currentMatchIndex}
          onPrevMatch={handlePrevMatch}
          onNextMatch={handleNextMatch}
          isDark={isDark}
        />
      ) : null}

      {/* Scroll to Bottom Floating Button */}
      {!isAtBottom && !isSearching ? (
        <Pressable
          className="absolute right-4 bg-primary-400 dark:bg-primary-500 rounded-full w-10 h-10 items-center justify-center shadow-lg z-20"
          style={{ bottom: Math.max(insets.bottom, 12) + 70 }}
          onPress={() => {
            listRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <ChevronDownIcon width={24} height={24} color="white" />
        </Pressable>
      ) : null}

      {/* Attachment Picker Popup Menu */}
      {!isSearching ? (
        <AttachmentPickerMenu
          isOpen={isAttachmentMenuOpen}
          onClose={() => setIsAttachmentMenuOpen(false)}
          onSelectPhotoUri={(uri) => handleSelectAttachment(uri)}
          onPickPhotoOrGallery={handlePickPhotoOrGallery}
          onPickDocument={handlePickDocument}
          onPickLocation={handlePickLocation}
          onPickContact={handlePickContact}
          isDark={isDark}
        />
      ) : null}

      {/* Input Area and Attachment Preview */}
      {!isSearching ? (
        <View style={{ width: '100%', backgroundColor: 'transparent' }}>
          <View ref={composerRef}>
            {selectedAttachment ? (
              <AttachmentPreviewBar
                attachment={selectedAttachment}
                onRemove={() => setSelectedAttachment(null)}
                isDark={isDark}
              />
            ) : null}
            <ChatInputBar
              message={message}
              onChangeText={handleTextChange}
              onSend={handleSendMessage}
              isPending={sendMessageMutation.isPending || isUploadingAttachment}
              insetsBottom={isKeyboardVisible ? 12 : insets.bottom}
              isDark={isDark}
              onToggleAttachmentMenu={() =>
                setIsAttachmentMenuOpen((prev) => !prev)
              }
              isAttachmentMenuOpen={isAttachmentMenuOpen}
            />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: windowHeight,
  },
});
