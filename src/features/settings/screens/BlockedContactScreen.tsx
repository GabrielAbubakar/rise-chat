import { BaseText, BaseTouchableOpacity, ScreenHeader } from "@/shared/components";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, View } from "react-native";
import ChevronRightIcon from "@/assets/icons/outline/cheveron-right.svg";

export function BlockedContactScreen() {
  const router = useRouter();

  const contacts = [
    {
      id: "1",
      name: "Annette Black",
      phone: "+61-827-680-673",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", // Mock avatar
    },
    {
      id: "2",
      name: "Arlene McCoy",
      phone: "+61-827-680-673",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d", // Mock avatar
    },
    {
      id: "3",
      name: "Annie Miles",
      phone: "+61-827-680-673",
      avatar: "https://i.pravatar.cc/150?img=16", // Mock avatar
    },
  ];

  return (
    <View className="flex-1 bg-app dark:bg-app-dark">
      <ScreenHeader title="Blocked Contact" onBack={() => router.back()} useSafeArea />
      
      <ScrollView className="flex-1 mt-2">
        {contacts.map((contact) => (
          <View key={contact.id} className="px-6">
            <BaseTouchableOpacity className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <Image
                  source={{ uri: contact.avatar }}
                  className="w-12 h-12 rounded-full mr-4 bg-neutral-200 dark:bg-neutral-800"
                />
                <View>
                  <BaseText className="text-[17px] font-medium text-black dark:text-white mb-0.5">
                    {contact.name}
                  </BaseText>
                  <BaseText className="text-[15px] text-neutral-400">
                    {contact.phone}
                  </BaseText>
                </View>
              </View>
              <ChevronRightIcon width={20} height={20} color="#6E8597" />
            </BaseTouchableOpacity>
          </View>
        ))}

        <View className="px-6 mt-4">
          <BaseText className="text-sm text-neutral-400 leading-5">
            Blocked contacts can't send messages and call you.
          </BaseText>
        </View>
      </ScrollView>
    </View>
  );
}
