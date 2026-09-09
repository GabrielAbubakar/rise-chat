import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Avatar,
  BaseText,
  BaseTouchableOpacity,
  ScreenHeader,
} from "@/shared/components";
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";
import PhoneIcon from "@/assets/icons/solid/phone.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import VideoIcon from "@/assets/icons/solid/video-camera.svg";

export interface ChatHeaderProps {
  isSearching: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onExitSearch: () => void;
  onStartSearch: () => void;
  participantName: string;
  participantAvatar?: string;
  participantInitials: string;
  isOtherOnline: boolean;
  isOtherTyping: boolean;
  conversationId: string;
  searchInputRef: React.RefObject<TextInput | null>;
}

export function ChatHeader({
  isSearching,
  searchQuery,
  onSearchQueryChange,
  onExitSearch,
  onStartSearch,
  participantName,
  participantAvatar,
  participantInitials,
  isOtherOnline,
  isOtherTyping,
  conversationId,
  searchInputRef,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <ScreenHeader useSafeArea withPadding={false} className="z-10 shadow-sm pt-4">
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
              onChangeText={onSearchQueryChange}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchQueryChange("")} className="p-1">
                <BaseText className="text-white/80 font-sf-bold text-xs">
                  ✕
                </BaseText>
              </Pressable>
            )}
          </View>
          <Pressable onPress={onExitSearch} className="px-2 py-1">
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
                  params: { id: conversationId },
                })
              }
              className="flex-row items-center flex-1"
            >
              <Avatar
                type={participantAvatar ? "image" : "initials"}
                source={participantAvatar}
                initials={participantInitials}
                size={40}
                className="ml-2"
              />

              <View className="ml-3 flex-1 justify-center">
                <BaseText className="text-white text-[18px] font-sf-bold">
                  {participantName}
                </BaseText>
                <BaseText type="body-md" className="text-white/80 mt-0.5">
                  {isOtherTyping
                    ? "typing..."
                    : isOtherOnline
                      ? "Online"
                      : "Offline"}
                </BaseText>
              </View>
            </BaseTouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable onPress={onStartSearch} className="p-1">
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
  );
}
