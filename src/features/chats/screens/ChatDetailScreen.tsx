import { useGetMe } from "@/features/settings/hooks/useProfile";
import {
  BaseButton,
  BaseText,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import {
  AppError,
  isSameDay,
  showApiErrorToast,
  showInfoToast,
} from "@/shared/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list/react-native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

import { chatsApi } from "../api";
import {
  AttachmentPickerMenu,
  AttachmentPreviewBar,
  ChatHeader,
  ChatInputBar,
  ChatMessageItem,
  ChatSearchNavigator,
  MessageActionsMenu,
  MessageAnchor,
  ReplyPreviewBar,
} from "../components";
import { DeliveryStatus } from "../components/MessagePill";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { useChatSearch } from "../hooks/useChatSearch";
import {
  chatsKeys,
  useConversationDetail,
  useConversationMessages,
  useConversationReceipts,
  useDeleteMessage,
  useMarkRead,
  useReactToMessage,
  useSendMessage,
  useUpdateMessage,
} from "../hooks/useChats";
import { useSendChatMessage } from "../hooks/useSendChatMessage";
import {
  MESSAGE_REACTION_EMOJIS,
  MessageReactionEmoji,
  MessageResponseDto,
} from "../types";

/** Real, server-confirmed messages; pending or failed sends can't be replied to, reacted to or deleted. */
const isSyncedMessage = (m: MessageResponseDto) =>
  !m.id.startsWith("temp_") && m.status !== "pending" && m.status !== "failed";

const isReactionEmoji = (emoji: string): emoji is MessageReactionEmoji =>
  (MESSAGE_REACTION_EMOJIS as readonly string[]).includes(emoji);

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

  const { data: user } = useGetMe();
  const currentUserId = user?.id;
  const conversationId = id || "";

  // API Hooks
  const {
    data: conversationDetail,
    isLoading: isConversationLoading,
    isError: isConversationError,
  } = useConversationDetail(conversationId, {
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
  const { data: receiptsData } = useConversationReceipts(conversationId);

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

  // Cache objects keyed by id; identity only changes when a message changes,
  // so reply quotes can be memo-compared by reference.
  const messageById = useMemo(() => {
    const map = new Map<string, MessageResponseDto>();
    messagesData?.pages.forEach((page) =>
      page.items.forEach((m) => map.set(m.id, m)),
    );
    return map;
  }, [messagesData]);

  // Message actions
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const replyTarget = replyToId ? messageById.get(replyToId) : undefined;
  // Drop the reply if its target disappears or is deleted meanwhile.
  const activeReplyTarget =
    replyTarget && !replyTarget.deletedAt ? replyTarget : undefined;
  const clearReply = useCallback(() => setReplyToId(null), []);

  const [actionTarget, setActionTarget] = useState<{
    messageId: string;
    anchor: MessageAnchor;
  } | null>(null);
  const actionMessage = actionTarget
    ? messageById.get(actionTarget.messageId)
    : undefined;
  const closeActionMenu = useCallback(() => setActionTarget(null), []);

  const { mutate: reactToMessage } = useReactToMessage(conversationId, {
    onError: (error) => showApiErrorToast(error, "Couldn't update reaction"),
  });
  const { mutate: deleteMessage } = useDeleteMessage(conversationId, {
    onError: (error) => showApiErrorToast(error, "Couldn't delete message"),
  });

  // Editing your own message reuses the composer; its text lives apart from
  // the draft so cancelling an edit leaves the draft untouched.
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editTarget = editingId ? messageById.get(editingId) : undefined;
  const activeEditTarget =
    editTarget && !editTarget.deletedAt ? editTarget : undefined;
  const isEditing = !!activeEditTarget;
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const { mutate: updateMessage } = useUpdateMessage(conversationId, {
    onError: (error) => {
      if (error instanceof AppError && error.statusCode === 409) {
        // MESSAGE_VERSION_CONFLICT / MESSAGE_DELETED: someone changed it first.
        showApiErrorToast(
          error,
          "This message changed before your edit was saved.",
          "Edit not saved",
        );
        queryClient.invalidateQueries({
          queryKey: chatsKeys.messages(conversationId),
        });
        return;
      }
      showApiErrorToast(error, "Couldn't save your edit");
    },
  });

  const handleSubmitEdit = useCallback(() => {
    const target = activeEditTarget;
    if (!target) return;
    const trimmed = editText.trim();
    const hasAttachments = !!target.attachments?.length;
    if (!trimmed && !hasAttachments) {
      showInfoToast("A message can't be empty. Delete it instead.");
      return;
    }
    const nextText = trimmed || null;
    if (nextText !== (target.text?.trim() || null)) {
      updateMessage({
        messageId: target.id,
        text: nextText,
        expectedVersion: target.version ?? 0,
      });
    }
    cancelEdit();
  }, [activeEditTarget, editText, updateMessage, cancelEdit]);

  const lastReadMessageIdRef = useRef<string | null>(null);

  // Mark messages as read and advance read receipts as incoming messages arrive and are viewed
  useEffect(() => {
    if (!conversationId) return;

    // Find the latest incoming confirmed message from another participant
    const incomingMessages = messages.filter(
      (m) => m.senderId !== currentUserId && !m.id.startsWith("temp_"),
    );
    const latestIncoming = incomingMessages[incomingMessages.length - 1];

    if (
      latestIncoming?.id &&
      latestIncoming.id !== lastReadMessageIdRef.current
    ) {
      lastReadMessageIdRef.current = latestIncoming.id;

      markRead();
      chatsApi
        .markReceiptRead(conversationId, {
          throughMessageId: latestIncoming.id,
        })
        .catch(() => {});
      chatsApi
        .markReceiptDelivered(conversationId, {
          throughMessageId: latestIncoming.id,
        })
        .catch(() => {});
    }
  }, [conversationId, messages, currentUserId, markRead]);

  // WebSocket Hook (incoming messages, presence, typing indicators)
  const otherParticipantId =
    conversationDetail?.type === "direct"
      ? conversationDetail.otherParticipant?.id
      : undefined;
  const { isOtherOnline, isOtherTyping, sendTypingStart, sendTypingStop } =
    useChatRealtime(conversationId, otherParticipantId);

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
    handleRetryMessage,
  } = useSendChatMessage({
    conversationId,
    sendMessageMutation,
    sendTypingStop,
    replyToMessageId: activeReplyTarget?.id ?? null,
    onReplyConsumed: clearReply,
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
        if (asset.fileSize && asset.fileSize > 52428800) {
          showApiErrorToast(
            new Error("Image exceeds 50 MB limit"),
            "File Too Large",
          );
          return;
        }
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
        type: [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        if (doc.size && doc.size > 52428800) {
          showApiErrorToast(
            new Error("Document exceeds 50 MB limit"),
            "File Too Large",
          );
          return;
        }
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
  const composerInputRef = useRef<TextInput>(null);

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

  // Back button handler for search mode
  useEffect(() => {
    const onBackPress = () => {
      if (isEditing) {
        cancelEdit();
        return true;
      }
      if (isSearching) {
        handleExitSearch();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => backHandler.remove();
  }, [isSearching, handleExitSearch, isEditing, cancelEdit]);

  // Keyboard visibility listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
        setIsAttachmentMenuOpen(false);
      },
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
  const isGroup = conversationDetail?.type === "group";

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

  const participantsMap = useMemo(() => {
    if (conversationDetail?.type === "group") {
      return conversationDetail.participants.reduce(
        (acc, p) => {
          acc[p.id] = p;
          return acc;
        },
        {} as Record<string, any>,
      );
    }
    return {};
  }, [conversationDetail]);

  const getSenderName = useCallback(
    (senderId: string) => {
      if (senderId === currentUserId) return "You";
      if (isGroup) return participantsMap[senderId]?.displayName || "Member";
      return otherParticipant?.displayName || participantName;
    },
    [currentUserId, isGroup, participantsMap, otherParticipant, participantName],
  );

  const toggleReaction = useCallback(
    (message: MessageResponseDto, emoji: MessageReactionEmoji) => {
      if (!isSyncedMessage(message) || message.deletedAt) return;
      const mine = message.reactions?.find((r) => r.userId === currentUserId);
      reactToMessage({
        messageId: message.id,
        emoji: mine?.emoji === emoji ? null : emoji,
      });
    },
    [currentUserId, reactToMessage],
  );

  const handleLongPressMessage = useCallback(
    (message: MessageResponseDto, anchor: MessageAnchor) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsAttachmentMenuOpen(false);
      setActionTarget({ messageId: message.id, anchor });
    },
    [],
  );

  const handlePressReaction = useCallback(
    (message: MessageResponseDto, emoji: string) => {
      if (isReactionEmoji(emoji)) toggleReaction(message, emoji);
    },
    [toggleReaction],
  );

  const handlePressReplyQuote = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) {
        showInfoToast("Scroll up to load the original message");
        return;
      }
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    },
    [messages],
  );

  const handleMenuReact = useCallback(
    (emoji: MessageReactionEmoji) => {
      if (actionMessage) toggleReaction(actionMessage, emoji);
      closeActionMenu();
    },
    [actionMessage, toggleReaction, closeActionMenu],
  );

  const handleMenuReply = useCallback(() => {
    if (actionMessage) setReplyToId(actionMessage.id);
    cancelEdit();
    closeActionMenu();
    setTimeout(() => composerInputRef.current?.focus(), 150);
  }, [actionMessage, cancelEdit, closeActionMenu]);

  const handleMenuEdit = useCallback(() => {
    if (actionMessage) {
      setReplyToId(null);
      setIsAttachmentMenuOpen(false);
      setEditingId(actionMessage.id);
      setEditText(actionMessage.text ?? "");
    }
    closeActionMenu();
    setTimeout(() => composerInputRef.current?.focus(), 150);
  }, [actionMessage, closeActionMenu]);

  const handleMenuCopy = useCallback(() => {
    const text = actionMessage?.text?.trim();
    closeActionMenu();
    if (!text) return;
    Clipboard.setStringAsync(text)
      .then(() => showInfoToast("Message copied"))
      .catch((error) => showApiErrorToast(error, "Couldn't copy message"));
  }, [actionMessage, closeActionMenu]);

  const handleMenuDelete = useCallback(() => {
    const target = actionMessage;
    closeActionMenu();
    if (!target) return;
    Alert.alert(
      "Delete message?",
      "This message will be deleted for everyone in this chat.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMessage({ messageId: target.id }),
        },
      ],
    );
  }, [actionMessage, closeActionMenu, deleteMessage]);

  const groupMembersText = useMemo(() => {
    if (!isGroup || !conversationDetail?.participants) return undefined;
    return conversationDetail.participants
      .filter((p) => p.id !== user?.id)
      .map((p) => (p.displayName || "User").split(" ")[0])
      .join(", ");
  }, [isGroup, conversationDetail, user?.id]);

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

  const getDeliveryStatus = useCallback(
    (item: MessageResponseDto): DeliveryStatus => {
      if (item.status === "failed") return "failed";
      if (item.status === "pending") return "pending";

      if (!receiptsData?.items || receiptsData.items.length === 0) {
        return "sent";
      }

      // Check frontiers from other participants
      const otherFrontiers = receiptsData.items.filter(
        (f) => !currentUserId || f.userId !== currentUserId,
      );

      if (otherFrontiers.length === 0) {
        return "sent";
      }

      const itemTime = new Date(item.createdAt).getTime();

      // Check if read by other participant(s)
      const isRead = otherFrontiers.some((f) => {
        if (!f.read) return false;
        if (f.read.messageId === item.id) return true;
        const readTime = new Date(f.read.at).getTime();
        return !isNaN(readTime) && itemTime <= readTime;
      });

      if (isRead) return "read";

      // Check if delivered to other participant(s)
      const isDelivered = otherFrontiers.some((f) => {
        if (!f.delivered) return false;
        if (f.delivered.messageId === item.id) return true;
        const deliveredTime = new Date(f.delivered.at).getTime();
        return !isNaN(deliveredTime) && itemTime <= deliveredTime;
      });

      if (isDelivered) return "delivered";

      return "sent";
    },
    [receiptsData, currentUserId],
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

      const isMe = item.senderId === currentUserId;
      let senderName = null;
      let senderAvatar = null;

      if (isGroup && !isMe) {
        const participant = participantsMap[item.senderId];
        senderName = participant?.displayName || null;
        senderAvatar = participant?.avatarUrl || null;
      }

      const deliveryStatus = isMe ? getDeliveryStatus(item) : undefined;

      return (
        <ChatMessageItem
          item={item}
          isMe={isMe}
          isCurrentMatch={isCurrentMatch}
          searchQuery={isSearching ? searchQuery : undefined}
          showDateSeparator={item.showDateSeparator ?? false}
          senderName={senderName}
          senderAvatar={senderAvatar}
          isGroupChat={isGroup}
          deliveryStatus={deliveryStatus}
          onRetry={() => handleRetryMessage(item.clientMessageId)}
          currentUserId={currentUserId}
          replyToMessage={
            item.replyToMessageId
              ? messageById.get(item.replyToMessageId)
              : undefined
          }
          getSenderName={getSenderName}
          onLongPressMessage={handleLongPressMessage}
          onPressReaction={handlePressReaction}
          onPressReplyQuote={handlePressReplyQuote}
        />
      );
    },
    [
      currentUserId,
      isSearching,
      matchingIndices,
      currentMatchIndex,
      searchQuery,
      isGroup,
      participantsMap,
      getDeliveryStatus,
      handleRetryMessage,
      messageById,
      getSenderName,
      handleLongPressMessage,
      handlePressReaction,
      handlePressReplyQuote,
    ],
  );

  if (isConversationLoading) {
    return (
      <ScreenContainer
        className="flex-1 bg-app dark:bg-app-dark items-center justify-center"
        withPadding={false}
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </ScreenContainer>
    );
  }

  if (!conversationId || isConversationError || !conversationDetail) {
    return (
      <ScreenContainer
        className="flex-1 bg-app dark:bg-app-dark"
        withPadding={false}
      >
        <ScreenHeader
          title="Conversation"
          onBack={() => router.replace("/(tabs)/chats")}
        />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 items-center justify-center mb-4">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={32}
              color="#EF4444"
            />
          </View>
          <BaseText type="h3" className="text-center font-sf-bold mb-2">
            Conversation Unavailable
          </BaseText>
          <BaseText
            color="secondary"
            className="text-center text-sm mb-6 max-w-[280px]"
          >
            This conversation does not exist, has been deleted, or you no longer
            have access to it.
          </BaseText>
          <BaseButton
            title="Return to Chats"
            variant="primary"
            onPress={() => router.replace("/(tabs)/chats")}
            accessibilityRole="button"
            accessibilityLabel="Return to chats list"
          />
        </View>
      </ScreenContainer>
    );
  }

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
        isGroup={isGroup}
        groupMembersText={groupMembersText}
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
            maintainScrollAtEndThreshold={2}
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
          onSelectPhotoUri={handleSelectAttachment}
          onPickPhotoOrGallery={handlePickPhotoOrGallery}
          onPickDocument={handlePickDocument}
          onPickLocation={handlePickLocation}
          onPickContact={handlePickContact}
          isDark={isDark}
        />
      ) : null}

      {/* Input Area and Attachment Preview */}
      {!isSearching ? (
        <View style={{ width: "100%", backgroundColor: "transparent" }}>
          <View ref={composerRef}>
            {activeEditTarget ? (
              <ReplyPreviewBar
                mode="edit"
                message={activeEditTarget}
                onCancel={cancelEdit}
                isDark={isDark}
              />
            ) : activeReplyTarget ? (
              <ReplyPreviewBar
                message={activeReplyTarget}
                senderName={getSenderName(activeReplyTarget.senderId)}
                onCancel={clearReply}
                isDark={isDark}
              />
            ) : null}
            {selectedAttachment && !isEditing ? (
              <AttachmentPreviewBar
                attachment={selectedAttachment}
                onRemove={() => setSelectedAttachment(null)}
                isDark={isDark}
              />
            ) : null}
            <ChatInputBar
              message={isEditing ? editText : message}
              onChangeText={isEditing ? setEditText : handleTextChange}
              onSend={isEditing ? handleSubmitEdit : handleSendMessage}
              isEditing={isEditing}
              isPending={
                !isEditing &&
                (sendMessageMutation.isPending || isUploadingAttachment)
              }
              insetsBottom={isKeyboardVisible ? 12 : insets.bottom}
              isDark={isDark}
              onToggleAttachmentMenu={() => {
                setIsAttachmentMenuOpen((prev) => {
                  if (!prev) {
                    Keyboard.dismiss();
                  }
                  return !prev;
                });
              }}
              isAttachmentMenuOpen={isAttachmentMenuOpen}
              inputRef={composerInputRef}
            />
          </View>
        </View>
      ) : null}

      {/* Long-press message actions */}
      <MessageActionsMenu
        visible={!!actionMessage}
        anchor={actionTarget?.anchor ?? null}
        isMe={actionMessage?.senderId === currentUserId}
        myReaction={
          actionMessage?.reactions?.find((r) => r.userId === currentUserId)
            ?.emoji
        }
        canReact={!!actionMessage && isSyncedMessage(actionMessage)}
        canReply={!!actionMessage && isSyncedMessage(actionMessage) && !isSearching}
        canCopy={!!actionMessage?.text?.trim()}
        canEdit={
          !!actionMessage &&
          isSyncedMessage(actionMessage) &&
          actionMessage.senderId === currentUserId &&
          !isSearching
        }
        onEdit={handleMenuEdit}
        canDelete={
          !!actionMessage &&
          isSyncedMessage(actionMessage) &&
          actionMessage.senderId === currentUserId
        }
        onReact={handleMenuReact}
        onReply={handleMenuReply}
        onCopy={handleMenuCopy}
        onDelete={handleMenuDelete}
        onClose={closeActionMenu}
        isDark={isDark}
      />
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
