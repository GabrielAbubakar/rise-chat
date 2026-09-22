import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

export interface SelectedAttachment {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface AttachmentPreviewBarProps {
  attachment: SelectedAttachment;
  onRemove: () => void;
  isDark?: boolean;
}

export function AttachmentPreviewBar({
  attachment,
  onRemove,
  isDark = false,
}: AttachmentPreviewBarProps) {
  const isImage =
    attachment.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(attachment.uri);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutDown.duration(200)}
      className="mx-4 mb-2 p-3 bg-white dark:bg-neutral-800 rounded-2xl border border-divider dark:border-neutral-700 flex-row items-center justify-between shadow-md"
    >
      <View className="flex-row items-center flex-1 mr-3">
        {isImage ? (
          <Image
            source={{ uri: attachment.uri }}
            className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-700"
            resizeMode="cover"
          />
        ) : (
          <View className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-950/50 items-center justify-center">
            <Ionicons name="document-text-outline" size={28} color="#10B981" />
          </View>
        )}

        <View className="ml-3 flex-1">
          <Text
            numberOfLines={1}
            className="text-body-md font-sf-bold text-slate-800 dark:text-slate-100"
          >
            {attachment.fileName || (isImage ? "Image Attachment" : "Document")}
          </Text>
          {attachment.fileSize ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {formatFileSize(attachment.fileSize)}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onRemove}
        className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center active:opacity-70"
        hitSlop={8}
      >
        <Ionicons
          name="close"
          size={18}
          color={isDark ? "#E5E7EB" : "#374151"}
        />
      </Pressable>
    </Animated.View>
  );
}
