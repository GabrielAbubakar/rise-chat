import { Image } from "expo-image";
import React from "react";
import { ScrollView, View } from "react-native";

import ChevronRightIcon from "@/assets/icons/solid/cheveron-right.svg";
import LinkIcon from "@/assets/icons/solid/link.svg";
import PhotographIcon from "@/assets/icons/solid/photograph.svg";
import StarIcon from "@/assets/icons/solid/star.svg";
import { BaseText, BaseTouchableOpacity } from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";

interface MediaSummaryRowsProps {
  photosCount?: number;
  starMessagesCount?: number;
  sharedLinksCount?: number;
  previewPhotos: any[];
  isDark: boolean;
  onOpenMediaTab: (tab: "photos" | "stars" | "links") => void;
}

export function MediaSummaryRows({
  photosCount,
  starMessagesCount,
  sharedLinksCount,
  previewPhotos,
  isDark,
  onOpenMediaTab,
}: MediaSummaryRowsProps) {
  const { primary } = useThemeColors();
  return (
    <View>
      {/* Photos Row */}
      <BaseTouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpenMediaTab("photos")}
        className="flex-row items-center justify-between py-3"
      >
        <View className="flex-row items-center">
          <PhotographIcon width={22} height={22} color={primary} />
          <BaseText className="text-neutral-900 dark:text-white ml-3">
            {photosCount !== undefined
              ? `${photosCount} ${photosCount === 1 ? "photo" : "photos"}`
              : `${previewPhotos.length} ${previewPhotos.length === 1 ? "photo" : "photos"}`}
          </BaseText>
        </View>
        <ChevronRightIcon
          width={18}
          height={18}
          color={isDark ? "#6E8597" : "#9CA3AF"}
        />
      </BaseTouchableOpacity>

      {/* 5 Horizontal Preview Photos or Empty State */}
      {previewPhotos.length === 0 ? (
        <View className="py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 my-1 items-center justify-center">
          <BaseText className="text-xs text-neutral-400 dark:text-neutral-500 font-sf-medium">
            No media shared yet
          </BaseText>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-1 mb-3"
        >
          {previewPhotos.map((photo, index) => (
            <BaseTouchableOpacity
              key={photo.id || index}
              activeOpacity={0.8}
              onPress={() => onOpenMediaTab("photos")}
              className="mr-3 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
            >
              <Image
                source={{
                  uri:
                    photo.url ||
                    photo.uri ||
                    (typeof photo === "string" ? photo : undefined),
                }}
                style={{ width: 62, height: 62 }}
                contentFit="cover"
              />
            </BaseTouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Star Messages Row */}
      <BaseTouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpenMediaTab("stars")}
        className="flex-row items-center justify-between py-3.5"
      >
        <View className="flex-row items-center">
          <StarIcon width={22} height={22} color={primary} />
          <BaseText className="text-neutral-900 dark:text-white font-sf-medium ml-3">
            {starMessagesCount || 43} star messages
          </BaseText>
        </View>
        <ChevronRightIcon
          width={18}
          height={18}
          color={isDark ? "#6E8597" : "#9CA3AF"}
        />
      </BaseTouchableOpacity>

      {/* Shared Links Row */}
      <BaseTouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpenMediaTab("links")}
        className="flex-row items-center justify-between py-3.5 border-t border-neutral-200 dark:border-neutral-700/50"
      >
        <View className="flex-row items-center">
          <LinkIcon width={22} height={22} color={primary} />
          <BaseText className="text-neutral-900 dark:text-white font-sf-medium text-base ml-3">
            {sharedLinksCount || 19} shared links
          </BaseText>
        </View>
        <ChevronRightIcon
          width={18}
          height={18}
          color={isDark ? "#6E8597" : "#9CA3AF"}
        />
      </BaseTouchableOpacity>
    </View>
  );
}
