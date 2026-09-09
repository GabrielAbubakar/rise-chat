import { Avatar, BaseText } from "@/shared/components";
import { useColorScheme } from "nativewind";
import React, { ComponentRef, useRef } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
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

export function ChatItem({
  data,
  isSelected,
  onPress,
  onLongPress,
}: ChatItemProps) {
  const isDirect = data.type === "direct";
  const displayName = isDirect ? data.otherParticipant.displayName : data.name;
  const avatarUrl = isDirect ? data.otherParticipant.avatarUrl : data.avatarUrl;
  const { latestMessage, unreadCount, lastActivityAt } = data;

  const lastMessage = latestMessage?.preview || "";
  const time = lastActivityAt
    ? new Date(lastActivityAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isPinned = data.settings?.pinned ?? false;
  const isArchived = data.settings?.archived ?? false;
  const isMuted = data.settings?.muted ?? false;
  const isActive = false; // Can be derived from data later

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const { mutate: archive, isPending: isArchiving } = useArchiveConversation(
    data.id,
  );
  const { mutate: unarchive, isPending: isUnarchiving } =
    useUnarchiveConversation(data.id);
  const { mutate: clearMessages, isPending: isClearing } = useClearMessages(
    data.id,
  );
  const { mutate: mute, isPending: isMuting } = useMuteConversation(data.id);
  const { mutate: unmute, isPending: isUnmuting } = useUnmuteConversation(
    data.id,
  );
  const { mutate: pin, isPending: isPinning } = usePinConversation(data.id);
  const { mutate: unpin, isPending: isUnpinning } = useUnpinConversation(
    data.id,
  );

  const isArchivePending = isArchiving || isUnarchiving;
  const isMutePending = isMuting || isUnmuting;
  const isPinPending = isPinning || isUnpinning;

  const swipeableRef = useRef<ComponentRef<typeof Swipeable>>(null);
  const closeSwipeable = () => swipeableRef.current?.close();

  const renderRightActions = () => {
    return (
      <View className="flex-row gap-x-2">
        <SwipeableActionButton
          onPress={() =>
            clearMessages(undefined, { onSuccess: closeSwipeable })
          }
          bgColorClass="bg-red-500"
          isPending={isClearing}
          icon={<TrashIcon width={24} height={24} color="white" />}
          title="Delete"
        />
        <SwipeableActionButton
          onPress={() =>
            isArchived
              ? unarchive(undefined, { onSuccess: closeSwipeable })
              : archive(undefined, { onSuccess: closeSwipeable })
          }
          bgColorClass="bg-neutral-300 dark:bg-neutral-600"
          isPending={isArchivePending}
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
    return (
      <View className="flex-row gap-x-2">
        <SwipeableActionButton
          onPress={() =>
            isMuted
              ? unmute(undefined, { onSuccess: closeSwipeable })
              : mute({ duration: "always" }, { onSuccess: closeSwipeable })
          }
          bgColorClass="bg-orange-400"
          isPending={isMutePending}
          icon={<VolumeOffIcon width={24} height={24} color="white" />}
          title={isMuted ? "Unmute" : "Mute"}
        />
        <SwipeableActionButton
          onPress={() =>
            isPinned
              ? unpin(undefined, { onSuccess: closeSwipeable })
              : pin(undefined, { onSuccess: closeSwipeable })
          }
          bgColorClass="bg-neutral-300 dark:bg-neutral-600"
          isPending={isPinPending}
          icon={<PinIcon width={24} height={24} color="white" />}
          title={isPinned ? "Unpin" : "Pin"}
        />
      </View>
    );
  };

  const hasAvatar = Boolean(avatarUrl);
  const avatarType =
    data.type === "direct" ? (hasAvatar ? "image" : "initials") : "group";

  const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <Animated.View layout={LinearTransition} exiting={FadeOut.duration(200)}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        friction={2.5}
        overshootFriction={4}
      >
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
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
              {lastMessage}
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
