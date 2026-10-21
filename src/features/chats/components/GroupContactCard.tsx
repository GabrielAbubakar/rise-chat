import React from "react";
import { Pressable, View } from "react-native";
import { Avatar, BaseText } from "@/shared/components";
import { useThemeColors } from "@/shared/hooks";
import CheckIcon from "@/assets/icons/solid/check.svg";
import { ContactItem } from "./NewChatBottomSheet";

export interface GroupContactCardProps {
  item: ContactItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const GroupContactCard = React.memo(
  ({ item, isSelected, onToggle }: GroupContactCardProps) => {
    const { primaryShades } = useThemeColors();
    return (
      <Pressable
        onPress={() => onToggle(item.participantId || item.id)}
        disabled={!item.participantId}
        className={`items-center w-16 ${!item.participantId ? "opacity-40" : ""}`}
      >
        <View className="relative mb-2">
          <View
            className="rounded-full overflow-hidden border-2"
            style={{
              borderColor: isSelected ? primaryShades[400] : "transparent",
            }}
          >
            <Avatar
              type={item.avatar ? "image" : "initials"}
              source={item.avatar}
              initials={item.name.charAt(0)}
              size={52}
            />
          </View>
          {isSelected && (
            <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center m-[2px]">
              <View
                className="w-6 h-6 items-center justify-center"
                style={{
                  borderRadius: 12,
                  backgroundColor: primaryShades[400],
                }}
              >
                <CheckIcon width={12} height={12} color="white" />
              </View>
            </View>
          )}
        </View>
        <BaseText
          type="body-md"
          className="text-center font-sf-medium text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {item.name.split(" ")[0]}
        </BaseText>
      </Pressable>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.participantId === nextProps.item.participantId &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.avatar === nextProps.item.avatar,
);

GroupContactCard.displayName = "GroupContactCard";
