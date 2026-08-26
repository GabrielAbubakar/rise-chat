import { Image } from "expo-image";
import { View } from "react-native";

import { DUMMY_GROUP_MEMBERS } from "@/constants/dummyData";
import { BaseText } from "@/shared/components";

interface GroupMembersListProps {
  members: typeof DUMMY_GROUP_MEMBERS;
}

export function GroupMembersList({ members }: GroupMembersListProps) {
  return (
    <View className="gap-y-1">
      {members.map((member) => (
        <View
          key={member.id}
          className="flex-row items-center justify-between py-2.5"
        >
          <View className="flex-row items-center flex-1">
            <View className="relative">
              <Image
                source={{ uri: member.avatar }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
              {member.isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-primary-400 rounded-full border-2 border-white dark:border-app-dark" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <BaseText className="text-neutral-900 dark:text-white font-sf-medium ">
                {member.name}
              </BaseText>
              <BaseText
                className={`text-sm mt-0.5 ${
                  member.isOnline
                    ? "text-primary-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {member.status}
              </BaseText>
            </View>
          </View>
          {member.role === "Admin" && (
            <View className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-2.5 py-0.5 border border-neutral-200 dark:border-neutral-700">
              <BaseText className="text-neutral-600 dark:text-neutral-300 text-sm font-sf-medium">
                Admin
              </BaseText>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
