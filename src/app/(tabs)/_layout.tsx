import { BaseText } from "@/shared/components";
import { tabs } from "@/shared/constants/tabs";
import { colors } from "@/shared/constants/tokens";
import { Tabs, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { View } from "react-native";
import { useEffect, useState } from "react";
import { useSecurityStore } from "@/store/useSecurityStore";
import { PinSetupPromptModal } from "@/features/security/components/PinSetupPromptModal";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const isPinSet = useSecurityStore((state) => state.isPinSet);
  const hasSkippedPinSetup = useSecurityStore((state) => state.hasSkippedPinSetup);
  const markPinSetupSkipped = useSecurityStore((state) => state.markPinSetupSkipped);

  const [showPinPrompt, setShowPinPrompt] = useState(false);

  useEffect(() => {
    // When arriving at the tabs flow, check if we should prompt for PIN setup
    if (!isPinSet && !hasSkippedPinSetup) {
      setShowPinPrompt(true);
    }
  }, [isPinSet, hasSkippedPinSetup]);

  const handleAcceptPinSetup = () => {
    setShowPinPrompt(false);
    router.push("/setup-pin");
  };

  const handleDeclinePinSetup = () => {
    markPinSetupSkipped();
    setShowPinPrompt(false);
  };

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: isDark ? colors.neutral[700] : "white",
      borderTopWidth: 0,
      elevation: 0,
      height: 95,
      paddingTop: 10,
    },
    tabBarActiveTintColor: colors.primary.DEFAULT,
    tabBarInactiveTintColor: colors.neutral[300],
  };

  function renderTabBarIcon(
    { color, focused }: { color: string | any; focused: boolean },
    tab: (typeof tabs)[number],
  ) {
    const Icon = tab.icon;
    return (
      <View className="items-center justify-center pt-2">
        <Icon color={color} width={28} height={28} />
      </View>
    );
  }

  return (
    <>
      <Tabs screenOptions={screenOptions}>
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, focused }) =>
                renderTabBarIcon({ color, focused }, tab),
              tabBarLabel: ({ color }) => {
                return (
                  <BaseText
                    style={{
                      color,
                      fontSize: 14,
                      marginTop: 6,
                      fontFamily: "SFProDisplay-Medium",
                    }}
                  >
                    {tab.title}
                  </BaseText>
                );
              },
            }}
          />
        ))}
      </Tabs>

      <PinSetupPromptModal
        visible={showPinPrompt}
        onAccept={handleAcceptPinSetup}
        onDecline={handleDeclinePinSetup}
      />
    </>
  );
}
