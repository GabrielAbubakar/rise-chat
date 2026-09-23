import { Avatar, BaseText } from "@/shared/components";
import { View } from "react-native";
import { GroupConversationParticipantDto } from "../types";

interface GroupMembersListProps {
  members?: GroupConversationParticipantDto[];
}

export function GroupMembersList({ members = [] }: GroupMembersListProps) {
  if (!members || members.length === 0) {
    return (
      <View className="py-4 items-center">
        <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-medium">
          No members in this group
        </BaseText>
      </View>
    );
  }

  return (
    <View className="gap-y-1">
      {members.map((member) => {
        const name = member.displayName || "User";
        const isOwnerOrAdmin =
          member.role === "owner" || member.role === "admin";
        const roleLabel =
          member.role === "owner"
            ? "Group Owner"
            : member.role === "admin"
              ? "Group Admin"
              : "Member";

        return (
          <View
            key={member.id}
            className="flex-row items-center justify-between py-2.5"
          >
            <View className="flex-row items-center flex-1">
              <Avatar
                type={member.avatarUrl ? "image" : "initials"}
                source={member.avatarUrl || undefined}
                initials={name.charAt(0)}
                size={44}
              />
              <View className="ml-3 flex-1">
                <BaseText className="text-neutral-900 dark:text-white font-sf-medium">
                  {name}
                </BaseText>
                <BaseText className="text-sm mt-0.5 text-neutral-500 dark:text-neutral-400">
                  {roleLabel}
                </BaseText>
              </View>
            </View>
            {isOwnerOrAdmin && (
              <View className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-2.5 py-0.5 border border-neutral-200 dark:border-neutral-700">
                <BaseText className="text-neutral-600 dark:text-neutral-300 text-sm font-sf-medium">
                  {member.role === "owner" ? "Owner" : "Admin"}
                </BaseText>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
