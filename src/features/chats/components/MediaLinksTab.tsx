import React from "react";
import { Pressable, ScrollView, View } from "react-native";

import LinkIcon from "@/assets/icons/solid/link.svg";
import VideoCameraIcon from "@/assets/icons/solid/video-camera.svg";
import { DUMMY_SHARED_LINKS } from "@/constants/dummyData";
import { BaseText } from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";

export function MediaLinksTab({
  sections,
  onOpenLink,
}: {
  sections: typeof DUMMY_SHARED_LINKS;
  onOpenLink: (url: string) => void;
}) {
  const { primary } = useThemeColors();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 24 }}
    >
      {sections.map((section) => (
        <View key={section.section} className="gap-y-3">
          {/* Date Section Header */}
          <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-lg">
            {section.section}
          </BaseText>

          {/* Section Links */}
          <View className="gap-y-2.5">
            {section.links.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => onOpenLink(link.url)}
                className="flex-row items-center bg-white dark:bg-app-dark rounded-2xl p-3.5 active:bg-neutral-50 dark:active:bg-neutral-700"
              >
                {/* Leading Brand/Icon Badge */}
                <View className="w-12 h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 items-center justify-center mr-3.5">
                  {link.type === "meet" ? (
                    <VideoCameraIcon width={24} height={24} color="#00AC47" />
                  ) : (
                    <LinkIcon
                      width={22}
                      height={22}
                      color={link.badgeColor || primary}
                    />
                  )}
                </View>

                {/* Title & URL */}
                <View className="flex-1 justify-center">
                  <BaseText className="text-neutral-900 dark:text-white font-sf-medium text-base">
                    {link.title}
                  </BaseText>
                  <BaseText
                    className="text-primary-400 dark:text-primary-400 font-sf-regular mt-0.5"
                    numberOfLines={1}
                  >
                    {link.url}
                  </BaseText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
