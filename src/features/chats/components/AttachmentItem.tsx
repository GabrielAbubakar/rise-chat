import { BaseText } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Linking, Pressable, View } from "react-native";
import { MessageAttachmentResponseDto } from "../types";

export function formatAttachmentSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface AttachmentItemProps {
  attachment: MessageAttachmentResponseDto;
  isMe: boolean;
  hasText: boolean;
}

export function AttachmentItem({
  attachment,
  isMe,
  hasText,
}: AttachmentItemProps) {
  const isImage =
    attachment.type === "image" ||
    attachment.contentType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(attachment.url);

  const isVideo =
    attachment.type === "video" ||
    attachment.contentType?.startsWith("video/") ||
    /\.(mp4|mov|webm)$/i.test(attachment.url);

  const isAudio =
    attachment.type === "audio" ||
    attachment.contentType?.startsWith("audio/") ||
    /\.(m4a|aac|mp3|wav|ogg)$/i.test(attachment.url);

  const handleOpen = () => {
    if (attachment.url) {
      Linking.openURL(attachment.url).catch((err) => {
        console.warn("Could not open attachment url:", err);
      });
    }
  };

  if (isImage) {
    return (
      <Pressable
        onPress={handleOpen}
        className="overflow-hidden rounded-xl"
        style={{ marginBottom: hasText ? 8 : 0 }}
      >
        <Image
          source={{ uri: attachment.url }}
          style={{ width: 220, height: 200, borderRadius: 12 }}
          contentFit="cover"
        />
      </Pressable>
    );
  }

  if (isVideo) {
    return (
      <Pressable
        onPress={handleOpen}
        className="w-[220px] h-[160px] rounded-xl bg-neutral-900 justify-center items-center overflow-hidden"
        style={{ marginBottom: hasText ? 8 : 0 }}
      >
        <View className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md items-center justify-center">
          <Ionicons
            name="play"
            size={24}
            color="white"
            style={{ marginLeft: 2 }}
          />
        </View>
        <BaseText
          className="text-white text-xs mt-2 font-sf-medium px-2"
          numberOfLines={1}
        >
          {attachment.originalFilename || "Video"}
        </BaseText>
      </Pressable>
    );
  }

  if (isAudio) {
    return (
      <Pressable
        onPress={handleOpen}
        className={`flex-row items-center py-2 px-3 rounded-xl ${
          isMe ? "bg-white/20" : "bg-neutral-100 dark:bg-neutral-700"
        }`}
        style={{ marginBottom: hasText ? 8 : 0, minWidth: 180 }}
      >
        <View className="w-9 h-9 rounded-full bg-primary items-center justify-center mr-2.5">
          <Ionicons name="musical-notes" size={18} color="white" />
        </View>
        <View className="flex-1">
          <BaseText
            numberOfLines={1}
            className={`text-xs font-sf-bold ${
              isMe ? "text-white" : "text-neutral-900 dark:text-white"
            }`}
          >
            {attachment.originalFilename || "Audio Note"}
          </BaseText>
          {!!attachment.sizeBytes && (
            <BaseText
              className={`text-[10px] ${
                isMe ? "text-white/80" : "text-neutral-500"
              }`}
            >
              {formatAttachmentSize(attachment.sizeBytes)}
            </BaseText>
          )}
        </View>
      </Pressable>
    );
  }

  // Document attachment card
  const filename =
    attachment.originalFilename ||
    attachment.url.split("/").pop()?.split("?")[0] ||
    "Document";

  const isPdf =
    attachment.contentType === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf");

  return (
    <Pressable
      onPress={handleOpen}
      className={`flex-row items-center p-3 rounded-xl border ${
        isMe
          ? "bg-white/15 border-white/25"
          : "bg-neutral-50 dark:bg-neutral-700/60 border-neutral-200 dark:border-neutral-600"
      }`}
      style={{ marginBottom: hasText ? 8 : 0, minWidth: 200, maxWidth: 240 }}
    >
      <View
        className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
          isPdf ? "bg-red-500/15" : "bg-blue-500/15"
        }`}
      >
        <Ionicons
          name={isPdf ? "document-text" : "document"}
          size={22}
          color={isPdf ? "#EF4444" : "#3B82F6"}
        />
      </View>
      <View className="flex-1">
        <BaseText
          numberOfLines={1}
          className={`text-xs font-sf-bold ${
            isMe ? "text-white" : "text-neutral-900 dark:text-white"
          }`}
        >
          {filename}
        </BaseText>
        <View className="flex-row items-center mt-0.5">
          {!!attachment.sizeBytes && (
            <BaseText
              className={`text-[11px] ${
                isMe ? "text-white/80" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {formatAttachmentSize(attachment.sizeBytes)} •{" "}
            </BaseText>
          )}
          <BaseText
            className={`text-[11px] font-sf-medium ${
              isMe ? "text-white underline" : "text-primary font-bold"
            }`}
          >
            Open
          </BaseText>
        </View>
      </View>
    </Pressable>
  );
}
