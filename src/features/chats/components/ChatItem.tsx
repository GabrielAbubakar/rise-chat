import { Avatar, BaseText } from "@/shared/components";
import { Pressable, View } from "react-native";
// import Swipeable from "react-native-gesture-handler/Swipeable";
import { useColorScheme } from "nativewind";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

// Icons
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import PinIcon from "@/assets/icons/solid/bookmark.svg";
import DotsIcon from "@/assets/icons/solid/dots-horizontal.svg";
import TrashIcon from "@/assets/icons/solid/trash.svg";
import VolumeOffIcon from "@/assets/icons/solid/volume-off.svg";
import { ConversationResponseDto } from "../types";

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
  const { otherParticipant, latestMessage, unreadCount, lastActivityAt } = data;
  
  const lastMessage = latestMessage?.preview || "";
  const time = lastActivityAt
    ? new Date(lastActivityAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  
  const isPinned = false; // Can be derived from data later
  const isActive = false; // Can be derived from data later
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const renderRightActions = () => {
    return (
      <View className="flex-row gap-x-2">
        <Pressable className="w-16 h-full items-center justify-center rounded-lg bg-red-500">
          <TrashIcon width={24} height={24} color="white" />
          <BaseText className="text-white">Delete</BaseText>
        </Pressable>
        <Pressable className="w-16 h-full items-center justify-center rounded-lg bg-neutral-300 dark:bg-neutral-600">
          <ArchiveIcon width={24} height={24} color="white" />
          <BaseText className="text-white">Archive</BaseText>
        </Pressable>
        <Pressable className="w-16 h-full items-center justify-center rounded-lg bg-neutral-500 dark:bg-neutral-700">
          <DotsIcon width={24} height={24} color="white" />
          <BaseText className="text-white">More</BaseText>
        </Pressable>
      </View>
    );
  };

  const renderLeftActions = () => {
    return (
      <View className="flex-row gap-x-2">
        <Pressable className="w-16 h-full items-center justify-center rounded-lg bg-orange-400">
          <VolumeOffIcon width={24} height={24} color="white" />
          <BaseText className="text-white">Mute</BaseText>
        </Pressable>
        <Pressable className="w-16 h-full items-center justify-center rounded-lg bg-neutral-300 dark:bg-neutral-600">
          <PinIcon width={24} height={24} color="white" />
          <BaseText className="text-white">Pinned</BaseText>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
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
            source={otherParticipant?.avatarUrl || undefined}
            initials={otherParticipant?.displayName?.charAt(0)}
            isActive={isActive}
            size={56}
          />
        </View>

        <View className="flex-1 ml-4 justify-center">
          <BaseText
            type="body-lg"
            className="text-label dark:text-label-dark font-sf-bold"
          >
            {otherParticipant?.displayName}
          </BaseText>
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
                width={12}
                height={12}
                fill={isDark ? "#6E8597" : "#3A566A"}
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
  );
}
