import { Image } from "expo-image";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";

import { DUMMY_PHOTOS } from "@/constants/dummyData";

const { width: windowWidth } = Dimensions.get("window");

export function MediaPhotosTab({ photos }: { photos: typeof DUMMY_PHOTOS }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
    >
      {/* Featured Wide Photo */}
      {photos[0] && (
        <View className="w-full h-52 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <Image
            source={{ uri: photos[0].url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      )}

      {/* 2x2 Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {photos.slice(1, 5).map((photo) => (
          <View
            key={photo.id}
            style={{ width: (windowWidth - 32 - 12) / 2 }}
            className="h-36 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <Image
              source={{ uri: photo.url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        ))}
      </View>

      {/* Middle Feature Photo */}
      {photos[5] && (
        <View className="w-full h-56 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <Image
            source={{ uri: photos[5].url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      )}

      {/* Bottom 3-Photo Row */}
      <View className="flex-row justify-between gap-x-3">
        {photos.slice(6, 9).map((photo) => (
          <View
            key={photo.id}
            style={{ width: (windowWidth - 32 - 24) / 3 }}
            className="h-28 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <Image
              source={{ uri: photo.url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
