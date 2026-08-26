import { BaseText } from "@/shared/components";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function FaceIdScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission?.granted && permission?.canAskAgain) {
        await requestPermission();
      }
      // Small delay to ensure smooth navigation transition before rendering camera
      setTimeout(() => setIsReady(true), 200);
    })();
  }, [permission, requestPermission]);

  return (
    <View className="flex-1 bg-black">
      {!isReady || !permission?.granted ? (
        <View className="flex-1 items-center justify-center bg-app dark:bg-app-dark">
          {!permission?.granted ? (
            <BaseText className="text-white text-center px-6">
              Camera access is required to use Face ID features. Please grant
              permission in your device settings.
            </BaseText>
          ) : (
            <ActivityIndicator size="large" color="#57B77D" />
          )}
        </View>
      ) : (
        <View className="flex-1">
          <CameraView style={StyleSheet.absoluteFill} facing="front" />
          
          <View className="flex-1 items-center justify-center mt-20" pointerEvents="none">
            <BaseText className="text-white text-[17px] text-center mb-10 shadow-sm">
              Please put your phone in front of your face
            </BaseText>

            {/* Mock face bounding box matching the design slightly */}
            <View className="w-72 h-72 relative">
              <View className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-[40px]" />
              <View className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-[40px]" />
              <View className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-[40px]" />
              <View className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-[40px]" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
