import { BaseText } from "@/shared/components";
import { tabs } from "@/shared/constants/tabs";
import { colors } from "@/shared/constants/tokens";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
    </>
  );
}
