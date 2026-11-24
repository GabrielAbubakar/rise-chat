import {
  Avatar,
  BaseText,
  BaseTouchableOpacity,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { showApiErrorToast, showSuccessToast } from "@/shared/utils";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useBlocksList, useUnblockUser } from "../hooks/useProfile";
import { BlockResponseDto } from "../types";

export function BlockedContactScreen() {
  const router = useRouter();
  const { data: blockListData, isLoading, refetch, isRefetching } = useBlocksList();

  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser({
    onSuccess: () => {
      showSuccessToast("Contact unblocked");
    },
    onError: (error) => {
      showApiErrorToast(error, "Failed to unblock contact");
    },
  });

  const handleUnblock = (userId: string, userName: string) => {
    Alert.alert(
      "Unblock Contact",
      `Are you sure you want to unblock ${userName}? They will be able to message and call you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: () => unblockUser(userId),
        },
      ],
    );
  };

  const items = blockListData?.items || [];

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        className="pt-10"
        title="Blocked Contacts"
        onBack={() => router.back()}
        useSafeArea
      />

      <ScrollView
        className="flex-1 mt-2"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#ffffff"
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4ADE80" />
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8 mt-16">
            <BaseText className="text-lg font-medium text-black dark:text-white mb-2">
              No blocked contacts
            </BaseText>
            <BaseText className="text-sm text-neutral-400 text-center leading-5">
              Contacts you block will appear here. They won't be able to send
              messages or call you.
            </BaseText>
          </View>
        ) : (
          items.map((item: BlockResponseDto) => (
            <View
              key={item.user.id}
              className="px-6 border-b border-neutral-100 dark:border-neutral-800/60"
            >
              <View className="flex-row items-center justify-between py-3.5">
                <View className="flex-row items-center flex-1 mr-3">
                  <Avatar
                    source={item.user.avatarUrl || undefined}
                    initials={item.user.displayName || "U"}
                    size={46}
                  />
                  <View className="ml-3 flex-1">
                    <BaseText
                      className="text-[17px] font-medium text-black dark:text-white mb-0.5"
                      numberOfLines={1}
                    >
                      {item.user.displayName || "Unknown User"}
                    </BaseText>
                    <BaseText className="text-[13px] text-neutral-400">
                      Blocked {new Date(item.blockedAt).toLocaleDateString()}
                    </BaseText>
                  </View>
                </View>
                <BaseTouchableOpacity
                  onPress={() =>
                    handleUnblock(
                      item.user.id,
                      item.user.displayName || "this contact",
                    )
                  }
                  disabled={isUnblocking}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800"
                >
                  <BaseText className="text-sm font-sf-medium text-red-500">
                    Unblock
                  </BaseText>
                </BaseTouchableOpacity>
              </View>
            </View>
          ))
        )}

        {items.length > 0 && (
          <View className="px-6 mt-6">
            <BaseText className="text-sm text-neutral-400 leading-5">
              Blocked contacts can't send messages or call you.
            </BaseText>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
