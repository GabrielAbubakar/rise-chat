import UserGroupIcon from "@/assets/icons/solid/user-group.svg";
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import { Image } from "expo-image";
import { View, ViewProps } from "react-native";
import { BaseText } from "./BaseText";
import { useThemeColors } from "../hooks";

export interface AvatarProps extends ViewProps {
  type?: "image" | "initials" | "group" | "archive";
  source?: string;
  initials?: string;
  backgroundColor?: string;
  size?: number;
  isActive?: boolean;
}

export function Avatar({
  type = "image",
  source,
  initials,
  backgroundColor,
  size = 56, // Default to w-14 h-14
  isActive = false,
  className = "",
  style,
  ...props
}: AvatarProps) {
  const { primary } = useThemeColors();
  const isImage = Boolean(type === "image" && source);
  const activeIndicatorSize = Math.max(12, size * 0.25);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: isImage ? "transparent" : (backgroundColor || primary),
    overflow: "hidden" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const formattedInitials = initials ? initials.substring(0, 2).toUpperCase() : "";

  return (
    <View className={`relative ${className}`} style={{ width: size, height: size }} {...props}>
      <View
        style={[containerStyle, style]}
        className="rounded-full overflow-hidden items-center justify-center"
      >
        {isImage ? (
          <Image
            source={{ uri: source }}
            style={{ width: "100%", height: "100%", borderRadius: size / 2 }}
            contentFit="cover"
          />
        ) : formattedInitials ? (
          <BaseText
            className="text-white font-sf-bold text-center"
            style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}
          >
            {formattedInitials}
          </BaseText>
        ) : type === "archive" ? (
          <ArchiveIcon width={size * 0.5} height={size * 0.5} color="white" />
        ) : (
          <UserGroupIcon width={size * 0.5} height={size * 0.5} color="white" />
        )}
      </View>

      {isActive && (
        <View
          className="absolute bottom-0 right-0 bg-primary-400 border-2 border-app dark:border-app-dark rounded-full"
          style={{ width: activeIndicatorSize, height: activeIndicatorSize, borderRadius: activeIndicatorSize / 2 }}
        />
      )}
    </View>
  );
}
