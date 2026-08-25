import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BaseButton,
  BaseInput,
  BaseText,
  PhoneInput,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";

import CameraIcon from "@/assets/icons/solid/camera.svg";
import QRCodeIcon from "@/assets/icons/solid/qrcode.svg";
import UserIcon from "@/assets/icons/solid/user.svg";
import XIcon from "@/assets/icons/solid/x.svg";
import { useColorScheme } from "nativewind";

export function NewContactScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningQR, setIsScanningQR] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidPhone, setIsValidPhone] = useState(false);

  const handleQRScan = () => {
    if (!permission?.granted) {
      requestPermission().then((res) => {
        if (res.granted) setIsScanningQR(true);
      });
    } else {
      setIsScanningQR(true);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    console.log("Scanned QR:", data);
    setIsScanningQR(false);
  };

  if (isScanningQR) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          <Pressable
            onPress={() => setIsScanningQR(false)}
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <XIcon width={24} height={24} color="white" />
          </Pressable>
        </View>
        <View
          style={StyleSheet.absoluteFill}
          className="items-center justify-center"
          pointerEvents="none"
        >
          <View className="w-64 h-64 border-2 border-primary-400 rounded-2xl bg-black/10" />
          <BaseText className="text-white mt-6 font-sf-bold text-lg text-center bg-black/50 px-4 py-2 rounded-lg">
            Scan QR Code
          </BaseText>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer isSafeArea={false} withPadding={false} isKeyboardAvoiding>
      {/* Header section */}
      <View className="z-10">
        <ScreenHeader
          title="New Contact"
          onBack={() => router.back()}
          rightComponent={<View style={{ width: 24 }} />}
          className="pb-20 pt-10"
        >
          <View />
        </ScreenHeader>

        {/* Avatar Placeholder */}
        <View className="items-center -mt-16 z-20">
          <View className="relative">
            <View className="w-40 h-40 rounded-full bg-[#B1C3D6] items-center justify-center overflow-hidden border-4 border-app dark:border-app-dark">
              <UserIcon
                width={100}
                height={100}
                color="#FFFFFF"
                style={{ marginTop: 20 }}
              />
            </View>
            <Pressable className="absolute bottom-1 right-1 w-10 h-10 bg-primary-400 rounded-full items-center justify-center border-4 border-app dark:border-app-dark">
              <CameraIcon width={20} height={20} color="white" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={5}
        style={{ flex: 1 }}
      > */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        <BaseInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          leftComponent={
            <UserIcon
              width={20}
              height={20}
              color={isDark ? "#6E8597" : "#9CA3AF"}
              className="mr-4"
            />
          }
        />

        <BaseInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          leftComponent={
            <UserIcon
              width={20}
              height={20}
              color={isDark ? "#6E8597" : "#9CA3AF"}
              className="mr-3"
            />
          }
        />

        <PhoneInput
          label="Phone Number"
          value={phoneNumber}
          onChangePhoneNumber={(raw, full, isValid) => {
            setPhoneNumber(raw);
            setIsValidPhone(isValid);
          }}
          placeholder="Phone number"
        />

        <View className="items-center mt-6">
          <Pressable onPress={handleQRScan} className="items-center">
            <QRCodeIcon
              width={32}
              height={32}
              color="#4ADE80"
              className="mb-2"
            />
            <BaseText className="text-neutral-500 dark:text-neutral-400">
              Or add via QR code
            </BaseText>
          </Pressable>
        </View>
      </ScrollView>

      <View
        className="px-6 bg-app dark:bg-app-dark"
        style={{ paddingBottom: Math.max(insets.bottom, 24), paddingTop: 16 }}
      >
        <BaseButton
          title="Save"
          onPress={() => {
            console.log("Save contact", { firstName, lastName, phoneNumber });
            router.back();
          }}
        />
      </View>
      {/* </KeyboardAvoidingView> */}
    </ScreenContainer>
  );
}
