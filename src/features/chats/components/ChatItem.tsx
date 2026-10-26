import { useGetMe } from "@/features/settings/hooks/useProfile";
import { Avatar, BaseText } from "@/shared/components";
import { formatLastMessageTime } from "@/shared/utils";
import { useColorScheme } from "nativewind";
import React, { ComponentRef, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { Pressable as RNGHPressable } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";

// Icons
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import PinIcon from "@/assets/icons/solid/bookmark.svg";
import DotsIcon from "@/assets/icons/solid/dots-horizontal.svg";
import TrashIcon from "@/assets/icons/solid/trash.svg";
import VolumeOffIcon from "@/assets/icons/solid/volume-off.svg";
import {
  useArchiveConversation,
  useClearMessages,
  useDeleteForMe,
  useMuteConversation,
  usePinConversation,
  useUnarchiveConversation,
  useUnmuteConversation,
  useUnpinConversation,
} from "../hooks/useChats";

import { ConversationResponseDto } from "../types";

interface SwipeableActionButtonProps {
  onPress?: () => void;
  bgColorClass: string;
  isPending?: boolean;
  icon: React.ReactNode;
  title: string;
}

const SwipeableActionButton = ({
  onPress,
  bgColorClass,
  isPending,
  icon,
  title,
}: SwipeableActionButtonProps) => {
  return (
    <RNGHPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
        { height: "100%" },
      ]}
    >
      <View
        className={`w-[72px] h-full items-center justify-center rounded-lg ${bgColorClass}`}
      >
        {isPending ? <ActivityIndicator size="small" color="white" /> : icon}
        <BaseText className="text-white">{title}</BaseText>
      </View>
    </RNGHPressable>
  );
};

interface ChatItemProps {
  data: ConversationResponseDto;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

let activeSwipeable: ComponentRef<typeof Swipeable> | null = null;

const setActiveSwipeable = (ref: ComponentRef<typeof Swipeable> | null) => {
  if (activeSwipeable && activeSwipeable !== ref) {
    activeSwipeable.close();
  }
  activeSwipeable = ref;
};

const clearActiveSwipeable = (ref: ComponentRef<typeof Swipeable> | null) => {
  if (activeSwipeable === ref) {
    activeSwipeable = null;
  }
};

export const closeActiveChatItemSwipeable = () => {
  if (activeSwipeable) {
    activeSwipeable.close();
    activeSwipeable = null;
  }
};

export function ChatItem({
  data,
  isSelected,
  onPress,
  onLongPress,
}: ChatItemProps) {
  const [isActionActive, setIsActionActive] = useState(false);
  const { data: user } = useGetMe();
  const isDirect = data.type === "direct";
  const displayName = isDirect ? data.otherParticipant.displayName : data.name;
  const avatarUrl = isDirect ? data.otherParticipant.avatarUrl : data.avatarUrl;
  const { latestMessage, unreadCount, lastActivityAt } = data;

  const displayMessage = (() => {
    const preview = latestMessage?.preview || "";
    if (!latestMessage) return preview;

    if (latestMessage.senderId === user?.id) return `You: ${preview}`;

    if (data.type === "group") {
      const sender = data.participants.find(
        (p) => p.id === latestMessage.senderId,
      );

      if (sender?.displayName) {
        return `${sender.displayName.split(" ")[0]}: ${preview}`;
      }
    }

    return preview;
  })();

  const time = formatLastMessageTime(lastActivityAt);

  const isPinned = data.settings?.pinned ?? false;
  const isArchived = data.settings?.archived ?? false;
  const isMuted = data.settings?.muted ?? false;
  const isActive = false; // Can be derived from data later

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const { mutate: archive } = useArchiveConversation(data.id);
  const { mutate: unarchive } = useUnarchiveConversation(data.id);
  const { mutate: clearMessages, isPending: isClearing } = useClearMessages(
    data.id,
  );
  const { mutate: deleteForMe, isPending: isDeletingForMe } = useDeleteForMe(
    data.id,
  );
  const { mutate: mute, isPending: isMuting } = useMuteConversation(data.id);
  const { mutate: unmute, isPending: isUnmuteConversation } =
    useUnmuteConversation(data.id);
  const { mutate: pin } = usePinConversation(data.id);
  const { mutate: unpin } = useUnpinConversation(data.id);

  const isMutePending = isMuting || isUnmuteConversation;

  const swipeableRef = useRef<ComponentRef<typeof Swipeable>>(null);
  const closeSwipeable = () => swipeableRef.current?.close();

  const handleWillOpen = () => {
    setActiveSwipeable(swipeableRef.current);
  };

  const handleClose = () => {
    clearActiveSwipeable(swipeableRef.current);
  };

  const handleSwipeAction = (action: () => void) => {
    setIsActionActive(true);
    closeSwipeable();
    clearActiveSwipeable(swipeableRef.current);
    setTimeout(() => {
      action();
      setTimeout(() => {
        setIsActionActive(false);
      }, 150);
    }, 200);
  };

  const handleDeleteOrClear = () => {
    if (isDirect) {
      Alert.alert(
        "Delete Conversation",
        `Are you sure you want to delete this conversation with ${displayName}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleSwipeAction(() => deleteForMe()),
          },
        ],
      );
    } else {
      Alert.alert(
        "Clear Message History",
        `Are you sure you want to clear message history in ${displayName}? Messages will only be cleared for your account.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear Messages",
            style: "destructive",
            onPress: () => handleSwipeAction(() => clearMessages()),
          },
        ],
      );
    }
  };

  const handleMuteAction = () => {
    if (isMuted) {
      handleSwipeAction(() => unmute());
    } else {
      Alert.alert(
        "Mute Conversation",
        `Select mute duration for ${displayName}:`,
        [
          {
            text: "8 Hours",
            onPress: () =>
              handleSwipeAction(() => mute({ duration: "8_hours" })),
          },
          {
            text: "24 Hours",
            onPress: () =>
              handleSwipeAction(() => mute({ duration: "24_hours" })),
          },
          {
            text: "1 Week",
            onPress: () =>
              handleSwipeAction(() => mute({ duration: "7_days" })),
          },
          {
            text: "Always",
            onPress: () =>
              handleSwipeAction(() => mute({ duration: "always" })),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }
  };

  const renderRightActions = () => {
    if (isActionActive) return null;
    return (
      <View className="flex-row gap-x-2">
        <SwipeableActionButton
          onPress={handleDeleteOrClear}
          bgColorClass="bg-red-500"
          isPending={isDirect ? isDeletingForMe : isClearing}
          icon={<TrashIcon width={24} height={24} color="white" />}
          title={isDirect ? "Delete" : "Clear"}
        />
        <SwipeableActionButton
          onPress={() =>
            handleSwipeAction(() => (isArchived ? unarchive() : archive()))
          }
          bgColorClass="bg-neutral-300 dark:bg-neutral-600"
          icon={<ArchiveIcon width={24} height={24} color="white" />}
          title={isArchived ? "Unarchive" : "Archive"}
        />
        <SwipeableActionButton
          bgColorClass="bg-neutral-500 dark:bg-neutral-700"
          icon={<DotsIcon width={24} height={24} color="white" />}
          title="More"
        />
      </View>
    );
  };

  const renderLeftActions = () => {
    if (isActionActive) return null;
    return (
      <View className="flex-row gap-x-2">
        <SwipeableActionButton
          onPress={handleMuteAction}
          bgColorClass="bg-orange-400"
          isPending={isMutePending}
          icon={<VolumeOffIcon width={24} height={24} color="white" />}
          title={isMuted ? "Unmute" : "Mute"}
        />
        <SwipeableActionButton
          onPress={() => handleSwipeAction(() => (isPinned ? unpin() : pin()))}
          bgColorClass="bg-neutral-300 dark:bg-neutral-600"
          icon={<PinIcon width={24} height={24} color="white" />}
          title={isPinned ? "Unpin" : "Pin"}
        />
      </View>
    );
  };

  const hasAvatar = Boolean(avatarUrl);
  const avatarType = hasAvatar
    ? "image"
    : data.type === "direct"
      ? "initials"
      : "group";

  const initials =
    data.type === "direct" && displayName
      ? displayName.charAt(0).toUpperCase()
      : undefined;

  return (
    <Animated.View
      layout={LinearTransition}
      exiting={FadeOut.duration(200)}
      className="overflow-hidden rounded-lg"
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableWillOpen={handleWillOpen}
        onSwipeableClose={handleClose}
        friction={2}
        overshootFriction={4}
      >
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          accessibilityRole="button"
          accessibilityLabel={`${displayName}, ${isMuted ? "muted, " : ""}${isPinned ? "pinned, " : ""}${isArchived ? "archived, " : ""}${unreadCount > 0 ? `${unreadCount} unread, ` : ""}${time ? `${time}, ` : ""}${displayMessage || ""}`}
          accessibilityHint="Double tap to open conversation. Use accessibility actions to manage."
          accessibilityActions={[
            { name: "activate", label: `Open chat with ${displayName}` },
            {
              name: isMuted ? "unmute" : "mute",
              label: isMuted ? "Unmute notifications" : "Mute notifications",
            },
            {
              name: isArchived ? "unarchive" : "archive",
              label: isArchived
                ? "Unarchive conversation"
                : "Archive conversation",
            },
            {
              name: isPinned ? "unpin" : "pin",
              label: isPinned ? "Unpin conversation" : "Pin conversation",
            },
            {
              name: isDirect ? "delete" : "clear",
              label: isDirect ? "Delete conversation" : "Clear group history",
            },
          ]}
          onAccessibilityAction={(event) => {
            switch (event.nativeEvent.actionName) {
              case "activate":
                onPress?.();
                break;
              case "mute":
              case "unmute":
                handleMuteAction();
                break;
              case "archive":
                archive();
                break;
              case "unarchive":
                unarchive();
                break;
              case "pin":
                pin();
                break;
              case "unpin":
                unpin();
                break;
              case "delete":
              case "clear":
                handleDeleteOrClear();
                break;
            }
          }}
          className={`flex-row items-center rounded-lg px-4 py-3 active:bg-primary-50 dark:active:bg-neutral-700 ${
            isSelected
              ? "bg-primary-50 dark:bg-neutral-700"
              : "bg-app dark:bg-app-dark"
          }`}
        >
          <View className="relative">
            <Avatar
              type={avatarType}
              source={avatarUrl || undefined}
              initials={initials}
              isActive={isActive}
              size={56}
            />
          </View>

          <View className="flex-1 ml-4 justify-center">
            <View className="flex-row items-center gap-x-2">
              <BaseText
                type="body-lg"
                className="text-label dark:text-label-dark font-sf-bold"
              >
                {displayName}
              </BaseText>
              {isMuted && (
                <VolumeOffIcon color={isDark ? "#6E8597" : "#3A566A"} />
              )}
            </View>
            <BaseText
              type="body-lg"
              numberOfLines={1}
              className="text-neutral-500 dark:text-neutral-300 mt-1"
            >
              {displayMessage}
            </BaseText>
          </View>

          <View className="items-end justify-center ml-2">
            <BaseText className="text-neutral-500 dark:text-neutral-300 mb-1">
              {time}
            </BaseText>
            <View className="flex-row items-center gap-2">
              {isPinned && (
                <PinIcon
                  width={20}
                  height={20}
                  color={isDark ? "#6E8597" : "#3A566A"}
                />
              )}
              {unreadCount > 0 && (
                <View className="bg-primary-400 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                  <BaseText className="text-white text-xs font-sf-bold">
                    {unreadCount}
                  </BaseText>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}
