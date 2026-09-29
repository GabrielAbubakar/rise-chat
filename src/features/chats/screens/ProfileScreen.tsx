import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  Switch,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shared Components
import {
  AddMembersBottomSheet,
  GroupMembersList,
  MediaSummaryRows,
} from "@/features/chats/components";
import {
  BaseText,
  BaseTouchableOpacity,
  ScreenContainer,
} from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";

// Icons
import AdjustmentsIcon from "@/assets/icons/solid/adjustments.svg";
import BanIcon from "@/assets/icons/solid/ban.svg";
import BellIcon from "@/assets/icons/solid/bell.svg";
import ChatIcon from "@/assets/icons/solid/chat.svg";
import ArrowLeftIcon from "@/assets/icons/solid/cheveron-left.svg";
import LogoutIcon from "@/assets/icons/solid/logout.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import UserAddIcon from "@/assets/icons/solid/user-add.svg";
import UserIcon from "@/assets/icons/solid/user.svg";

// Utilities
import { formatLastSeen } from "@/shared/utils";

// API Hooks & Dummy Media
import { DUMMY_PHOTOS } from "@shared/constants/dummyData";
import { useConversationDetail } from "../hooks/useChats";

export interface ProfileScreenProps {
  id?: string;
}

export function ProfileScreen({ id }: ProfileScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { primary } = useThemeColors();

  // const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const backAction = () => {
      if (isSearchMode) {
        setIsSearchMode(false);
        setSearchQuery("");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [isSearchMode]);

  const addMembersBottomSheetRef = useRef<BottomSheetModal>(null);

  const conversationId = id || "";
  const { data: conversationDetail, isLoading } = useConversationDetail(
    conversationId,
    { enabled: !!conversationId },
  );

  const isDirect = conversationDetail?.type === "direct";
  const otherParticipant = isDirect
    ? conversationDetail?.otherParticipant
    : null;
  const name = isDirect
    ? otherParticipant?.displayName || "User"
    : conversationDetail?.name || "Group";
  const avatar = isDirect
    ? otherParticipant?.avatarUrl
    : conversationDetail?.avatarUrl;
  const isGroup = conversationDetail?.type === "group";
  const lastSeenText = formatLastSeen(conversationDetail?.lastActivityAt);
  const groupParticipants =
    conversationDetail?.type === "group" ? conversationDetail.participants : [];

  const existingParticipantIds = groupParticipants.map((p) => p.id);

  const filteredMembers =
    isSearchMode && searchQuery.trim() !== ""
      ? groupParticipants.filter((m) =>
          (m.displayName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        )
      : groupParticipants;

  const previewPhotos = DUMMY_PHOTOS.slice(0, 5);

  const handleOpenMediaTab = (tab: "photos" | "stars" | "links") => {
    router.push({
      pathname: "/chat/media",
      params: { id: conversationId, initialTab: tab },
    });
  };

  const handleSearchChat = () => {
    router.replace({
      pathname: "/chat/[id]",
      params: { id: conversationId, search: "true" },
    });
  };

  const handleOpenQrCode = () => {
    router.push({
      pathname: "/chat/qr",
      params: { id: conversationId },
    });
  };

  const handleBlockContact = () => {
    Alert.alert(
      "Block Contact",
      `Are you sure you want to block ${name}? You won't receive messages or calls from them.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => router.back() },
      ],
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave group", `Are you sure you want to leave ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer
        withPadding={false}
        isSafeArea={false}
        className="flex-1 bg-white dark:bg-app-dark items-center justify-center"
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </ScreenContainer>
    );
  }

  const renderHeroBanner = () => (
    <View className="relative w-full" style={{ height: isGroup ? 250 : 340 }}>
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <View className="w-full h-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center">
          <UserIcon
            width={100}
            height={100}
            color={isDark ? "#6E8597" : "#9CA3AF"}
          />
        </View>
      )}

      {/* Dark gradient / tint overlay */}
      <View className="absolute inset-0 bg-black/25" />

      <View className="mb-4 absolute bottom-4 left-6 z-10">
        <BaseText className="text-white text-3xl font-sf-bold">{name}</BaseText>
        <BaseText className="text-white/80 font-sf-regular mt-0.5">
          {lastSeenText}
        </BaseText>
      </View>

      {/* Top Bar Floating Over Header Image */}
      <View
        className="absolute pt-6 left-0 right-0 px-6 flex-row items-center justify-between z-10"
        style={{ top: Math.max(insets.top, 16) }}
      >
        <BaseTouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <ArrowLeftIcon width={24} height={24} color="white" />
        </BaseTouchableOpacity>

        <View className="flex-row items-center gap-3">
          <BaseTouchableOpacity
            activeOpacity={0.8}
            onPress={handleSearchChat}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <SearchIcon width={22} height={22} color="white" />
          </BaseTouchableOpacity>

          <BaseTouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenQrCode}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <AdjustmentsIcon width={22} height={22} color="white" />
          </BaseTouchableOpacity>
        </View>
      </View>

      {/* Floating Action Button (for individual user profiles) */}
      {!isGroup && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat/[id]",
              params: { id: conversationId },
            })
          }
          className="absolute right-6 -bottom-6 w-14 h-14 rounded-full bg-primary-400 items-center justify-center shadow-lg z-20"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <ChatIcon width={28} height={28} color="white" />
        </Pressable>
      )}
    </View>
  );

  const renderGroupHeader = () => (
    <View>
      {renderHeroBanner()}
      <View className="p-6">
        <View className="py-2.5 mb-2">
          <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-medium text-lg mb-1">
            Description
          </BaseText>
          <BaseText className="text-neutral-700 dark:text-neutral-200 font-sf-regular leading-5">
            Group conversation
          </BaseText>
        </View>
      </View>

      <View className="bg-neutral-200 dark:bg-neutral-700 h-3 w-full" />

      <View className="p-6">
        <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg mb-2">
          Media, Links, and Docs
        </BaseText>
        <MediaSummaryRows
          previewPhotos={previewPhotos}
          isDark={isDark}
          onOpenMediaTab={handleOpenMediaTab}
        />
      </View>

      <View className="bg-neutral-200 dark:bg-neutral-700 h-3 w-full" />

      <View className="p-6 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg">
            Members (
            {isGroup && conversationDetail?.participants
              ? conversationDetail.participants.length
              : 0}
            )
          </BaseText>
          <View className="flex-row items-center gap-4">
            <Pressable
              className="p-1"
              onPress={() => setIsSearchMode(true)}
              hitSlop={2}
            >
              <SearchIcon
                width={20}
                height={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </Pressable>
            <Pressable
              className="p-1"
              onPress={() => addMembersBottomSheetRef.current?.present()}
              hitSlop={2}
            >
              <UserAddIcon
                width={20}
                height={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const renderGroupFooter = () => (
    <View>
      <View className="bg-neutral-200 dark:bg-neutral-700 h-3 w-full mt-2" />
      <Pressable
        onPress={handleLeaveGroup}
        className="flex-row items-center p-4 border-t border-neutral-200 dark:border-neutral-700/50 mt-1"
      >
        <LogoutIcon width={22} height={22} color="#EF4444" />
        <BaseText className="text-red-500 font-sf-medium text-base ml-3">
          Leave group
        </BaseText>
      </Pressable>
    </View>
  );

  const renderSearchHeader = () => (
    <View
      className="px-6 pb-4"
      style={{ paddingTop: Math.max(insets.top, 16) + 10 }}
    >
      <View className="flex-row items-center gap-3">
        <BaseTouchableOpacity
          onPress={() => {
            setIsSearchMode(false);
            setSearchQuery("");
          }}
          className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
        >
          <ArrowLeftIcon
            width={24}
            height={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </BaseTouchableOpacity>
        <TextInput
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 font-sf-medium text-black dark:text-white"
          placeholder="Search members..."
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      isScrollable={!isGroup}
      contentContainerClassName="pb-12"
      className="flex-1 bg-white dark:bg-app-dark"
    >
      {isGroup ? (
        <GroupMembersList
          conversationId={conversationId}
          members={filteredMembers}
          allMembers={groupParticipants}
          ListHeaderComponent={
            <Animated.View
              layout={LinearTransition.springify().damping(20).stiffness(150)}
            >
              {isSearchMode ? (
                <Animated.View
                  key="search"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                >
                  {renderSearchHeader()}
                </Animated.View>
              ) : (
                <Animated.View
                  key="group"
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                >
                  {renderGroupHeader()}
                </Animated.View>
              )}
            </Animated.View>
          }
          ListFooterComponent={isSearchMode ? null : renderGroupFooter()}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          }}
        />
      ) : (
        <>
          {renderHeroBanner()}
          <View>
            <View className="px-6 py-4 gap-2">
              <View>
                <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg">
                  {name}
                </BaseText>
                <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-regular mt-0.5">
                  Phone Number
                </BaseText>
              </View>
              <View>
                <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg">
                  Busy
                </BaseText>
                <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-regular mt-0.5">
                  Description
                </BaseText>
              </View>
            </View>
            <View className="bg-neutral-200 dark:bg-neutral-700 h-3 w-full" />
            <View className="mt-2 px-4">
              <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg mb-2">
                About
              </BaseText>

              <MediaSummaryRows
                previewPhotos={previewPhotos}
                isDark={isDark}
                onOpenMediaTab={handleOpenMediaTab}
              />

              <View className="flex-row items-center justify-between py-3.5 border-t border-neutral-200 dark:border-neutral-700/50">
                <View className="flex-row items-center">
                  <BellIcon width={22} height={22} color={primary} />
                  <BaseText className="text-neutral-900 dark:text-white font-sf-medium text-base ml-3">
                    Notifications
                  </BaseText>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: isDark ? "#3A566A" : "#E5E7EB",
                    true: primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            <View className="bg-neutral-200 dark:bg-neutral-700 h-3 w-full" />
            <Pressable
              onPress={handleBlockContact}
              className="flex-row items-center p-4 border-t border-neutral-200 dark:border-neutral-700/50 mt-1"
            >
              <BanIcon width={22} height={22} color="#EF4444" />
              <BaseText className="text-red-500 font-sf-medium text-base ml-3">
                Block contact
              </BaseText>
            </Pressable>
          </View>
        </>
      )}
      {isGroup && (
        <AddMembersBottomSheet
          ref={addMembersBottomSheetRef}
          conversationId={conversationId}
          existingParticipantIds={existingParticipantIds}
        />
      )}
    </ScreenContainer>
  );
}
