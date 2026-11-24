import ChevronRightIcon from "@/assets/icons/outline/cheveron-right.svg";
import { clearPinCode } from "@/services/security/pin";
import {
  BaseText,
  BaseTouchableOpacity,
  ScreenContainer,
  ScreenHeader,
} from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";
import { useSecurityStore } from "@/store/useSecurityStore";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Alert, ScrollView, Switch, View } from "react-native";
import Toast from "react-native-toast-message";
import { useBlocksList } from "../hooks/useProfile";

export function PrivacyScreen() {
  const router = useRouter();
  const { data: blockedContacts } = useBlocksList();
  const { primary } = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const setPinStatus = useSecurityStore((state) => state.setPinStatus);
  const setBiometricsEnabled = useSecurityStore(
    (state) => state.setBiometricsEnabled,
  );

  const handleTogglePin = (value: boolean) => {
    if (!value) {
      Alert.alert(
        "Remove Security PIN?",
        "Are you sure you want to remove your PIN code? This will disable app lock and biometric authentication on this device.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await clearPinCode();
                setPinStatus(false);
                setBiometricsEnabled(false);
                Toast.show({
                  type: "success",
                  text1: "Security PIN Removed",
                  text2: "App lock has been disabled on this device.",
                });
              } catch (e) {
                console.error("Failed to remove PIN", e);
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Failed to remove Security PIN. Please try again.",
                });
              }
            },
          },
        ],
      );
    } else {
      router.push("/setup-pin");
    }
  };

  const renderItem = (
    label: string,
    value: string,
    onPress: () => void,
    isLast: boolean = false,
  ) => (
    <View className="px-6">
      <BaseTouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between py-5"
      >
        <BaseText className="text-[17px] font-medium text-black dark:text-white">
          {label}
        </BaseText>
        <View className="flex-row items-center">
          {value ? (
            <BaseText className="text-base text-neutral-400 mr-2">
              {value}
            </BaseText>
          ) : null}
          <ChevronRightIcon width={20} height={20} color="#6E8597" />
        </View>
      </BaseTouchableOpacity>
      {!isLast && <View className="h-[1px] bg-divider dark:bg-divider-dark" />}
    </View>
  );

  const renderToggleItem = (
    label: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    description?: string,
    isLast: boolean = false,
  ) => (
    <View className="px-6">
      <View className="flex-row items-center justify-between py-5">
        <View className="flex-1 mr-4">
          <BaseText className="text-[17px] font-medium text-black dark:text-white">
            {label}
          </BaseText>
          {description ? (
            <BaseText className="text-sm text-neutral-400 mt-1">
              {description}
            </BaseText>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: isDark ? "#374151" : "#E5E7EB",
            true: primary,
          }}
          thumbColor="#FFFFFF"
        />
      </View>
      {!isLast && <View className="h-[1px] bg-divider dark:bg-divider-dark" />}
    </View>
  );

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      className="flex-1 bg-app dark:bg-app-dark"
    >
      <ScreenHeader
        className="pt-10"
        title="Privacy"
        onBack={() => router.back()}
        useSafeArea
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        {renderItem("Last Seen", "Everyone", () =>
          router.push({
            pathname: "/settings/privacy-selection",
            params: { type: "Last Seen" },
          }),
        )}
        {renderItem("Profile Photo", "My Contact", () =>
          router.push({
            pathname: "/settings/privacy-selection",
            params: { type: "Profile Photo" },
          }),
        )}
        {renderItem("About", "My Contact", () =>
          router.push({
            pathname: "/settings/privacy-selection",
            params: { type: "About" },
          }),
        )}
        {renderItem("Group", "Everyone", () =>
          router.push({
            pathname: "/settings/privacy-selection",
            params: { type: "Group" },
          }),
        )}
        {renderItem(
          "Blocked Contact",
          ` ${blockedContacts?.items.length} Contacts` || "",
          () => router.push("/settings/blocked-contact"),
        )}
        {renderToggleItem(
          "Security PIN",
          isPinSet,
          handleTogglePin,
          isPinSet
            ? "App lock is active"
            : "Protect app access with a 4-digit PIN",
        )}
        {renderItem(
          "Face ID",
          isPinSet ? "" : "Requires PIN",
          () => {
            if (!isPinSet) {
              Toast.show({
                type: "info",
                text1: "Security PIN Required",
              });
              return;
            }
            router.push("/settings/face-id");
          },
          true,
        )}

        <View className="px-6 mt-4">
          <BaseText className="text-sm text-neutral-400 leading-5">
            With Security PIN and Face ID, you can secure your app and
            conversations.
          </BaseText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
