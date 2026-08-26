import UserGroupIcon from "@/assets/icons/solid/user-group.svg";
import ArchiveIcon from "@/assets/icons/solid/archive.svg";
import { Image } from "expo-image";
import { View, ViewProps } from "react-native";
import { BaseText } from "./BaseText";

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
  backgroundColor = "#57B77D", // Default to primary-400
  size = 56, // Default to w-14 h-14
  isActive = false,
  className = "",
  style,
  ...props
}: AvatarProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: type !== "image" ? backgroundColor : "transparent",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const activeIndicatorSize = Math.max(12, size * 0.25);

  return (
    <View className={`relative ${className}`} {...props}>
      {type === "image" && source ? (
        <Image
          source={{ uri: source }}
          style={containerStyle}
          contentFit="cover"
        />
      ) : type === "initials" && initials ? (
        <View style={containerStyle}>
          <BaseText
            className="text-white font-sf-bold"
            style={{ fontSize: size * 0.4 }}
          >
            {initials.substring(0, 2).toUpperCase()}
          </BaseText>
        </View>
      ) : type === "archive" ? (
        <View style={containerStyle}>
          <ArchiveIcon width={size * 0.5} height={size * 0.5} color="white" />
        </View>
      ) : (
        <View style={containerStyle}>
          <UserGroupIcon width={size * 0.5} height={size * 0.5} color="white" />
        </View>
      )}

      {isActive && (
        <View
          className="absolute bottom-0 right-0 bg-primary-400 border-2 border-app dark:border-app-dark rounded-full"
          style={{ width: activeIndicatorSize, height: activeIndicatorSize }}
        />
      )}
    </View>
  );
}
