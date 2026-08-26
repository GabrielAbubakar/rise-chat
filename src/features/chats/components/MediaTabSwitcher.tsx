import React from "react";
import { Pressable, View } from "react-native";
import { BaseText } from "@/shared/components";

export type MediaTab = "photos" | "stars" | "links";

interface MediaTabSwitcherProps {
  activeTab: MediaTab;
  setActiveTab: (tab: MediaTab) => void;
  isDark: boolean;
}

export function MediaTabSwitcher({
  activeTab,
  setActiveTab,
  isDark,
}: MediaTabSwitcherProps) {
  return (
    <View className="py-6 px-4">
      <View className="flex-row items-center bg-app dark:bg-neutral-800 rounded-xl p-1 border border-white/25 dark:border-neutral-700">
        {[
          { id: "photos", label: "Photo" },
          { id: "stars", label: "Star" },
          { id: "links", label: "Links" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as MediaTab)}
              hitSlop={8}
              style={{
                backgroundColor: isActive
                  ? isDark
                    ? "#1F3C51"
                    : "#FFFFFF"
                  : "transparent",
              }}
              className="flex-1 py-2 items-center justify-center rounded-xl"
            >
              <BaseText
                className={`font-sf-bold text-sm ${
                  isActive
                    ? isDark
                      ? "text-white"
                      : "text-neutral-900"
                    : isDark
                      ? "text-neutral-400"
                      : "text-neutral-500"
                }`}
              >
                {tab.label}
              </BaseText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
