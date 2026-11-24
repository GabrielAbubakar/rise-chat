import { BaseText } from "@/shared/components";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MESSAGE_REACTION_EMOJIS, MessageReactionEmoji } from "../types";

/** Window-relative frame of the long-pressed bubble. */
export interface MessageAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MessageActionsMenuProps {
  visible: boolean;
  anchor: MessageAnchor | null;
  isMe: boolean;
  /** Your current reaction on the message, highlighted in the bar. */
  myReaction?: string | null;
  canReact: boolean;
  canReply: boolean;
  canCopy: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onReact: (emoji: MessageReactionEmoji) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isDark?: boolean;
}

const SCREEN_MARGIN = 16;
const GAP = 8;
const REACTION_BAR_HEIGHT = 52;
const ACTION_ROW_HEIGHT = 48;
const MENU_WIDTH = 220;

type IconName = ComponentProps<typeof Ionicons>["name"];

interface ActionItem {
  key: string;
  label: string;
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
}

export function MessageActionsMenu({
  visible,
  anchor,
  isMe,
  myReaction,
  canReact,
  canReply,
  canCopy,
  canEdit,
  canDelete,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onClose,
  isDark = false,
}: MessageActionsMenuProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const actions: ActionItem[] = [];
  if (canReply) {
    actions.push({
      key: "reply",
      label: "Reply",
      icon: "arrow-undo-outline",
      onPress: onReply,
    });
  }
  if (canCopy) {
    actions.push({
      key: "copy",
      label: "Copy",
      icon: "copy-outline",
      onPress: onCopy,
    });
  }
  if (canEdit) {
    actions.push({
      key: "edit",
      label: "Edit",
      icon: "pencil-outline",
      onPress: onEdit,
    });
  }
  if (canDelete) {
    actions.push({
      key: "delete",
      label: "Delete for everyone",
      icon: "trash-outline",
      destructive: true,
      onPress: onDelete,
    });
  }

  // Heights are fixed per row, so the menu's size is known before layout.
  const menuHeight =
    (canReact ? REACTION_BAR_HEIGHT + GAP : 0) +
    actions.length * ACTION_ROW_HEIGHT;

  const minTop = insets.top + SCREEN_MARGIN;
  const maxTop = windowHeight - insets.bottom - SCREEN_MARGIN - menuHeight;
  let top = windowHeight / 2 - menuHeight / 2;
  if (anchor) {
    const below = anchor.y + anchor.height + GAP;
    const above = anchor.y - menuHeight - GAP;
    top = below <= maxTop ? below : above >= minTop ? above : maxTop;
  }
  top = Math.max(minTop, Math.min(top, maxTop));

  const horizontal = isMe
    ? { right: SCREEN_MARGIN }
    : {
        left: Math.min(
          Math.max(anchor?.x ?? SCREEN_MARGIN, SCREEN_MARGIN),
          windowWidth - MENU_WIDTH - SCREEN_MARGIN,
        ),
      };

  const iconColor = isDark ? "#E5E7EB" : "#374151";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        className="flex-1 bg-black/40"
      >
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close message actions"
        />

        <Animated.View
          entering={ZoomIn.duration(180)}
          style={[{ position: "absolute", top }, horizontal]}
          className={isMe ? "items-end" : "items-start"}
        >
          {canReact ? (
            <View
              className="flex-row items-center bg-white dark:bg-neutral-800 rounded-full px-1.5 shadow-lg"
              style={{ height: REACTION_BAR_HEIGHT, marginBottom: GAP }}
              accessibilityRole="toolbar"
              accessibilityLabel="Reactions"
            >
              {MESSAGE_REACTION_EMOJIS.map((emoji) => {
                const selected = myReaction === emoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => onReact(emoji)}
                    className={`w-10 h-10 mx-0.5 rounded-full items-center justify-center active:opacity-60 ${
                      selected ? "bg-primary-100 dark:bg-primary-900/50" : ""
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={
                      selected
                        ? `Remove ${emoji} reaction`
                        : `React with ${emoji}`
                    }
                    accessibilityState={{ selected }}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {actions.length > 0 ? (
            <View
              className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-lg"
              style={{ width: MENU_WIDTH }}
              accessibilityRole="menu"
            >
              {actions.map((action, index) => (
                <Pressable
                  key={action.key}
                  onPress={action.onPress}
                  className={`flex-row items-center justify-between px-4 active:bg-neutral-100 dark:active:bg-neutral-700 ${
                    index > 0
                      ? "border-t border-divider dark:border-neutral-700"
                      : ""
                  }`}
                  style={{ height: ACTION_ROW_HEIGHT }}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.label}
                >
                  <BaseText
                    className={`text-body-md ${
                      action.destructive
                        ? "text-red-500"
                        : "text-neutral-700 dark:text-white"
                    }`}
                  >
                    {action.label}
                  </BaseText>
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={action.destructive ? "#EF4444" : iconColor}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
