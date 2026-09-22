import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library/legacy";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

export interface AttachmentPickerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhotoUri: (uri: string) => void;
  onPickPhotoOrGallery: () => void;
  onPickDocument: () => void;
  onPickLocation: () => void;
  onPickContact: () => void;
  isDark?: boolean;
}

export function AttachmentPickerMenu({
  isOpen,
  onClose,
  onSelectPhotoUri,
  onPickPhotoOrGallery,
  onPickDocument,
  onPickLocation,
  onPickContact,
  isDark = false,
}: AttachmentPickerMenuProps) {
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadRecentPhotos = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === "granted");

        if (status === "granted") {
          const res = await MediaLibrary.getAssetsAsync({
            first: 15,
            mediaType: "photo" as any,
            sortBy: "creationTime" as any,
          });
          setRecentPhotos(res.assets || []);
        }
      } catch (error) {
        console.log("Error fetching recent device photos:", error);
      }
    };

    loadRecentPhotos();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectPhotoUri(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.log("Error launching camera:", error);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOutDown.duration(200)}
      className="mx-4 mb-2 bg-white dark:bg-neutral-800 rounded-[24px] p-4 shadow-xl border border-divider dark:border-neutral-700 z-30"
    >
      {/* Top Section - Recent Device Media Gallery Horizontal Scroll */}
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {/* Camera Trigger Tile */}
          <TouchableOpacity
            onPress={handleLaunchCamera}
            activeOpacity={0.8}
            className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-700 items-center justify-center mr-3 relative overflow-hidden"
          >
            {recentPhotos.length > 0 ? (
              <Image
                source={{ uri: recentPhotos[0].uri }}
                className="w-full h-full opacity-60"
              />
            ) : null}
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <View className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow">
                <Ionicons name="camera" size={20} color="#374151" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Recent Device Photo Thumbnails */}
          {recentPhotos.map((asset) => (
            <TouchableOpacity
              key={asset.id}
              onPress={() => {
                onSelectPhotoUri(asset.uri);
                onClose();
              }}
              activeOpacity={0.85}
              className="mr-3"
            >
              <Image
                source={{ uri: asset.uri }}
                className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-700"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Section - Media Options List */}
      <View className="pt-1 border-t border-neutral-100 dark:border-neutral-700/60">
        {/* Photo or Gallery */}
        <TouchableOpacity
          onPress={() => {
            onPickPhotoOrGallery();
            onClose();
          }}
          activeOpacity={0.7}
          className="flex-row items-center py-3 px-2 rounded-xl active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <View className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mr-4">
            <Ionicons name="image-outline" size={22} color="#10B981" />
          </View>
          <Text className="text-[17px] font-medium text-slate-800 dark:text-slate-100">
            Photo or Gallery
          </Text>
        </TouchableOpacity>

        {/* Document */}
        <TouchableOpacity
          onPress={() => {
            onPickDocument();
            onClose();
          }}
          activeOpacity={0.7}
          className="flex-row items-center py-3 px-2 rounded-xl active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <View className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mr-4">
            <Ionicons name="document-text-outline" size={22} color="#10B981" />
          </View>
          <Text className="text-[17px] font-medium text-slate-800 dark:text-slate-100">
            Document
          </Text>
        </TouchableOpacity>

        {/* Location */}
        <TouchableOpacity
          onPress={() => {
            onPickLocation();
            onClose();
          }}
          activeOpacity={0.7}
          className="flex-row items-center py-3 px-2 rounded-xl active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <View className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mr-4">
            <Ionicons name="location-outline" size={22} color="#10B981" />
          </View>
          <Text className="text-[17px] font-medium text-slate-800 dark:text-slate-100">
            Location
          </Text>
        </TouchableOpacity>

        {/* Contact */}
        <TouchableOpacity
          onPress={() => {
            onPickContact();
            onClose();
          }}
          activeOpacity={0.7}
          className="flex-row items-center py-3 px-2 rounded-xl active:bg-neutral-100 dark:active:bg-neutral-700"
        >
          <View className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mr-4">
            <Ionicons name="person-outline" size={22} color="#10B981" />
          </View>
          <Text className="text-[17px] font-medium text-slate-800 dark:text-slate-100">
            Contact
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
