import { Avatar, BaseText } from "@/shared/components";
import { ActivityIndicator, Alert, View } from "react-native";
import { Pressable as RNGHPressable } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { GroupConversationParticipantDto } from "../types";

interface SwipeActionProps {
  label: string;
  colorClass: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function SwipeAction({
  label,
  colorClass,
  isLoading,
  disabled,
  onPress,
}: SwipeActionProps) {
  return (
    <RNGHPressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
        { height: "100%" },
      ]}
    >
      <View
        className={`w-[72px] h-full items-center justify-center rounded-lg ${colorClass}`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <BaseText
            className="font-sf-medium text-sm text-center"
            style={{ color: "white" }}
          >
            {label}
          </BaseText>
        )}
      </View>
    </RNGHPressable>
  );
}

interface MemberSwipeActionsProps {
  member: GroupConversationParticipantDto;
  currentUserRole: string;
  loadingAction: {
    id: string;
    type: "remove" | "update" | "transfer";
  } | null;
  setLoadingAction: (
    action: { id: string; type: "remove" | "update" | "transfer" } | null,
  ) => void;
  transferOwnership: (vars: any, options?: any) => void;
  updateRole: (vars: any, options?: any) => void;
  removeMember: (vars: any, options?: any) => void;
  onClose: () => void;
}

function MemberSwipeActions({
  member,
  currentUserRole,
  loadingAction,
  setLoadingAction,
  transferOwnership,
  updateRole,
  removeMember,
  onClose,
}: MemberSwipeActionsProps) {
  return (
    <View className="flex-row h-full gap-x-2 pl-2">
      {currentUserRole === "owner" && (
        <>
          <SwipeAction
            label="Make Owner"
            colorClass="bg-neutral-500 dark:bg-neutral-700"
            isLoading={
              loadingAction?.id === member.id &&
              loadingAction?.type === "transfer"
            }
            onPress={() => {
              Alert.alert(
                "Transfer Ownership",
                `Are you sure you want to make ${member.displayName} the new owner?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Make Owner",
                    onPress: () => {
                      setLoadingAction({
                        id: member.id,
                        type: "transfer",
                      });
                      transferOwnership(
                        { newOwnerId: member.id },
                        {
                          onSuccess: onClose,
                          onSettled: () => setLoadingAction(null),
                        },
                      );
                    },
                  },
                ],
              );
            }}
          />

          <SwipeAction
            label={member.role === "admin" ? "Demote" : "Make Admin"}
            colorClass="bg-amber-500"
            isLoading={
              loadingAction?.id === member.id &&
              loadingAction?.type === "update"
            }
            onPress={() => {
              const newRole = member.role === "admin" ? "member" : "admin";
              setLoadingAction({ id: member.id, type: "update" });
              updateRole(
                {
                  memberId: member.id,
                  data: { role: newRole },
                },
                {
                  onSuccess: onClose,
                  onSettled: () => setLoadingAction(null),
                },
              );
            }}
          />
        </>
      )}

      <SwipeAction
        label="Remove"
        colorClass="bg-red-500"
        isLoading={
          loadingAction?.id === member.id && loadingAction?.type === "remove"
        }
        onPress={() => {
          Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${member.displayName}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => {
                  setLoadingAction({ id: member.id, type: "remove" });
                  removeMember(member.id, {
                    onSuccess: onClose,
                    onSettled: () => setLoadingAction(null),
                  });
                },
              },
            ],
          );
        }}
      />
    </View>
  );
}

export interface GroupMemberItemProps {
  member: GroupConversationParticipantDto;
  currentUserRole: string;
  canManageMember: boolean;
  loadingAction: {
    id: string;
    type: "remove" | "update" | "transfer";
  } | null;
  setLoadingAction: (
    action: { id: string; type: "remove" | "update" | "transfer" } | null,
  ) => void;
  transferOwnership: (vars: any, options?: any) => void;
  updateRole: (vars: any, options?: any) => void;
  removeMember: (vars: any, options?: any) => void;
  onMenuOpen: () => void;
  registerRef: (ref: any) => void;
  onClose: () => void;
}

export function GroupMemberItem({
  member,
  currentUserRole,
  canManageMember,
  loadingAction,
  setLoadingAction,
  transferOwnership,
  updateRole,
  removeMember,
  onMenuOpen,
  registerRef,
  onClose,
}: GroupMemberItemProps) {
  const name = member.displayName || "User";
  const isOwnerOrAdmin = member.role === "owner" || member.role === "admin";
  const roleLabel =
    member.role === "owner"
      ? "Group Owner"
      : member.role === "admin"
        ? "Group Admin"
        : "Member";

  const renderRightActions = () => {
    if (!canManageMember) return null;

    return (
      <MemberSwipeActions
        member={member}
        currentUserRole={currentUserRole}
        loadingAction={loadingAction}
        setLoadingAction={setLoadingAction}
        transferOwnership={transferOwnership}
        updateRole={updateRole}
        removeMember={removeMember}
        onClose={onClose}
      />
    );
  };

  return (
    <Swipeable
      ref={registerRef}
      onSwipeableWillOpen={onMenuOpen}
      renderRightActions={canManageMember ? renderRightActions : undefined}
      friction={2}
      rightThreshold={40}
    >
      <View className="flex-row items-center justify-between py-2.5 bg-white dark:bg-app-dark px-2 -mx-2">
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

        <View className="flex-row items-center">
          {isOwnerOrAdmin && (
            <View className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-2.5 py-0.5 border border-neutral-200 dark:border-neutral-700">
              <BaseText className="text-neutral-600 dark:text-neutral-300 text-sm font-sf-medium">
                {member.role === "owner" ? "Owner" : "Admin"}
              </BaseText>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );
}
