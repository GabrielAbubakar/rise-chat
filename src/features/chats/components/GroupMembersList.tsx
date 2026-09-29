import { useGetMe } from "@/features/settings/hooks/useProfile";
import { BaseText } from "@/shared/components";
import { ReactElement, useRef, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
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
  allMembers?: GroupConversationParticipantDto[];
  ListHeaderComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function GroupMembersList({
  conversationId,
  members = [],
  allMembers,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
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

  const sourceMembers = allMembers || members;
  const currentUserParticipant = sourceMembers.find(
    (m) => m.id === currentUser?.id,
  );
  const currentUserRole = currentUserParticipant?.role || "member";

  const canManageMember = (member: GroupConversationParticipantDto) => {
    if (!currentUser || member.id === currentUser.id) return false;
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin" && member.role === "member") return true;
    return false;
  };

  if (!members || members.length === 0) {
    return (
      <Animated.FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={ListHeaderComponent as any}
        ListFooterComponent={ListFooterComponent as any}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={() => (
          <View className="py-4 items-center">
            <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-medium">
              No members in this group
            </BaseText>
          </View>
        )}
      />
    );
  }

  return (
    <Animated.FlatList
      data={members}
      itemLayoutAnimation={LinearTransition.duration(400)}
      ListHeaderComponent={ListHeaderComponent as any}
      ListFooterComponent={ListFooterComponent as any}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={(item) => item.id}
      renderItem={({ item: member }) => (
        <Animated.View
          layout={LinearTransition.springify().damping(20).stiffness(150)}
          className="mb-1 px-5"
        >
          <GroupMemberItem
            member={member}
            isCurrentUser={member.id === currentUser?.id}
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
        </Animated.View>
      )}
    />
  );
}
