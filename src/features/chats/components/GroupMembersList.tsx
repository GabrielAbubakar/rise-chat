import { useGetMe } from "@/features/settings/hooks/useProfile";
import { BaseText } from "@/shared/components";
import { useRef, useState } from "react";
import { View } from "react-native";
import {
  useRemoveGroupMember,
  useTransferGroupOwnership,
  useUpdateGroupMemberRole,
} from "../hooks/useGroupActions";
import { GroupConversationParticipantDto } from "../types";
import { GroupMemberItem } from "./GroupMemberItem";

interface GroupMembersListProps {
  conversationId?: string;
  members?: GroupConversationParticipantDto[];
}


export function GroupMembersList({
  conversationId,
  members = [],
}: GroupMembersListProps) {
  const { data: currentUser } = useGetMe();

  const swipeableRefs = useRef<Map<string, any>>(new Map());
  const currentlyOpenId = useRef<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<{
    id: string;
    type: "remove" | "update" | "transfer";
  } | null>(null);

  const { mutate: removeMember } = useRemoveGroupMember(conversationId || "");
  const { mutate: updateRole } = useUpdateGroupMemberRole(conversationId || "");
  const { mutate: transferOwnership } = useTransferGroupOwnership(
    conversationId || "",
  );

  const currentUserParticipant = members.find((m) => m.id === currentUser?.id);
  const currentUserRole = currentUserParticipant?.role || "member";

  const canManageMember = (member: GroupConversationParticipantDto) => {
    if (!currentUser || member.id === currentUser.id) return false;
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin" && member.role === "member") return true;
    return false;
  };

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
        return (
          <GroupMemberItem
            key={member.id}
            member={member}
            currentUserRole={currentUserRole}
            canManageMember={canManageMember(member)}
            loadingAction={loadingAction}
            setLoadingAction={setLoadingAction}
            transferOwnership={transferOwnership}
            updateRole={updateRole}
            removeMember={removeMember}
            onMenuOpen={() => {
              if (
                currentlyOpenId.current &&
                currentlyOpenId.current !== member.id
              ) {
                const prev = swipeableRefs.current.get(currentlyOpenId.current);
                if (prev) {
                  prev.close();
                }
              }
              currentlyOpenId.current = member.id;
            }}
            registerRef={(ref) => {
              if (ref) {
                swipeableRefs.current.set(member.id, ref);
              } else {
                swipeableRefs.current.delete(member.id);
              }
            }}
            onClose={() => swipeableRefs.current.get(member.id)?.close()}
          />
        );
      })}
    </View>
  );
}
