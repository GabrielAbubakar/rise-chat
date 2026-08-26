import LogoWithText from "@/assets/images/logo-with-text.svg";
import { BaseButton, BaseText, ScreenContainer } from "@/shared/components";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Image, View } from "react-native";

import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export function WelcomeScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <ScreenContainer
      isSafeArea={false}
      withPadding={false}
      className="flex-1 items-center"
    >
      <Animated.View
        entering={FadeInUp.delay(600).duration(1000).springify()}
        className="absolute top-20 left-[33%] z-10"
      >
        <LogoWithText />
      </Animated.View>
      <Image
        source={
          isDarkMode
            ? require("@/assets/images/illustration-onboarding-dark.png")
            : require("@/assets/images/illustration-onboarding.png")
        }
        className="w-full"
      />

      <View className="w-full p-8">
        <BaseText
          animated
          align="center"
          entering={FadeInDown.delay(1200).duration(800).springify()}
          type="h2"
          className="mb-3"
        >
          Stay connected with your friends and family
        </BaseText>

        <BaseText
          animated
          align="center"
          entering={FadeInDown.delay(1200).duration(800).springify()}
          type="body-md"
          className="mb-6 text-neutral-300 dark:text-neutral-300"
        >
          ChatMe is messaging app that will help you to connect with everyone.
        </BaseText>

        <BaseButton
          animated
          entering={FadeInDown.delay(1600).duration(800).springify()}
          title="Get Started"
          onPress={() => router.push("/(auth)/register")}
        />
      </View>
    </ScreenContainer>
  );
}
