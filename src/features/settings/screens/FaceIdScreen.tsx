import { BaseText, ScreenContainer, ScreenHeader } from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";
import { useSecurityStore } from "@/store/useSecurityStore";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, Switch, View } from "react-native";
import Toast from "react-native-toast-message";

export function FaceIdScreen() {
  const router = useRouter();
  const { primary } = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const isBiometricsEnabled = useSecurityStore(
    (state) => state.isBiometricsEnabled,
  );
  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const setBiometricsEnabled = useSecurityStore(
    (state) => state.setBiometricsEnabled,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricName, setBiometricName] = useState("Biometrics");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [hardware, enrolled, types] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);

        if (!active) return;
        setHasHardware(hardware);
        setIsEnrolled(enrolled);

        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricName("Face ID");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricName("Fingerprint / Touch ID");
        } else {
          setBiometricName("Biometric Unlock");
        }
      } catch (e) {
        console.error("Error detecting biometrics capability", e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      if (!isPinSet) {
        Toast.show({
          type: "error",
          text1: "Security PIN Required",
          text2: "Please set up a Security PIN before enabling biometrics.",
        });
        return;
      }

      if (!hasHardware || !isEnrolled) {
        Toast.show({
          type: "error",
          text1: "Biometrics Unavailable",
          text2: !hasHardware
            ? "Your device does not support biometric security."
            : "Please enroll biometric data in your device settings first.",
        });
        return;
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Authenticate to enable ${biometricName}`,
          cancelLabel: "Cancel",
          fallbackLabel: "Use PIN",
        });

        if (result.success) {
          setBiometricsEnabled(true);
          Toast.show({
            type: "success",
            text1: `${biometricName} Enabled`,
            text2: `You can now unlock the app using ${biometricName}.`,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Authentication Canceled",
            text2: "Could not verify your identity.",
          });
        }
      } catch (error) {
        console.error("Biometric authentication error", error);
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "An error occurred during verification.",
        });
      }
    } else {
      setBiometricsEnabled(false);
      Toast.show({
        type: "info",
        text1: `${biometricName} Disabled`,
      });
    }
  };

  return (
    <ScreenContainer
      withPadding={false}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        title={biometricName}
        onBack={() => router.back()}
        useSafeArea
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <View className="flex-1 px-6 pt-8">
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons
                name={
                  biometricName === "Face ID"
                    ? "scan-outline"
                    : "finger-print-outline"
                }
                size={44}
                color={primary}
              />
            </View>
            <BaseText type="h3" className="mb-2 text-center">
              {biometricName}
            </BaseText>
            <BaseText
              type="body-md"
              color="secondary"
              className="text-center px-4"
            >
              Secure your conversations and quickly unlock Rise Chat using your
              device's biometric security.
            </BaseText>
          </View>

          <View className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700/50">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <BaseText className="font-sf-medium text-base text-neutral-900 dark:text-white">
                  Enable {biometricName}
                </BaseText>
                <BaseText className="text-xs text-neutral-500 mt-1">
                  Use your biometric signature to verify app unlock
                </BaseText>
              </View>
              <Switch
                value={isBiometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{
                  false: isDark ? "#3A566A" : "#E5E7EB",
                  true: primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {!isEnrolled && (
            <View className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
              <BaseText className="text-xs text-amber-800 dark:text-amber-300">
                Notice: {biometricName} is not enrolled on this device. Please
                enroll your biometric data in your system settings to enable
                this feature.
              </BaseText>
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
