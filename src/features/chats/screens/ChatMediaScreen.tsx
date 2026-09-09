import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

// Shared Components
import { ScreenContainer, ScreenHeader } from "@/shared/components";

// Icons
import SearchIcon from "@/assets/icons/solid/search.svg";

// Dummy Data
import {
  DUMMY_CHATS,
  DUMMY_PHOTOS,
  DUMMY_SHARED_LINKS,
  DUMMY_STARRED_MESSAGES,
} from "@/constants/dummyData";

// Feature Components
import {
  MediaLinksTab,
  MediaPhotosTab,
  MediaStarsTab,
  MediaTab,
  MediaTabSwitcher,
} from "@/features/chats/components";

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export interface ChatMediaScreenProps {
  id?: string;
  initialTab?: string;
}

export function ChatMediaScreen({ id, initialTab }: ChatMediaScreenProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const normalizeTab = (val?: string | string[]): MediaTab => {
    const raw = Array.isArray(val) ? val[0] : val;
    if (raw === "stars" || raw === "star") return "stars";
    if (raw === "links" || raw === "link") return "links";
    return "photos";
  };

  const [activeTab, setActiveTab] = useState<MediaTab>(
    normalizeTab(initialTab),
  );
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(normalizeTab(initialTab));
  }

  const chat = DUMMY_CHATS.find((c) => c.id === id) || DUMMY_CHATS[0];

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "photos":
        return "Photos";
      case "stars":
        return "Star Message";
      case "links":
        return "Shared Links";
      default:
        return "Photos";
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Open Link", url);
    }
  };

  const handleSearchPress = () => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: chat.id, search: "true" },
    });
  };

  return (
    <ScreenContainer
      withPadding={false}
      isSafeArea={false}
      className="flex-1 bg-white dark:bg-app-dark"
    >
      {/* Header Container */}
      <ScreenHeader
        title={getHeaderTitle()}
        onBack={() => router.back()}
        useSafeArea
        withPadding={false}
        className="z-20 pt-4 px-4 bg-primary-400 dark:bg-app-dark"
        rightComponent={
          activeTab !== "photos" ? (
            <Pressable
              onPress={handleSearchPress}
              hitSlop={15}
              className="w-10 h-10 items-end justify-center"
            >
              <SearchIcon width={22} height={22} color="white" />
            </Pressable>
          ) : (
            <View className="w-10 h-10" />
          )
        }
      />

      {/* Tab Pill Switcher */}
      <MediaTabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
      />

      {/* Tab Content Views */}
      <View className="flex-1">
        {activeTab === "photos" && <MediaPhotosTab photos={DUMMY_PHOTOS} />}
        {activeTab === "stars" && (
          <MediaStarsTab messages={DUMMY_STARRED_MESSAGES} isDark={isDark} />
        )}
        {activeTab === "links" && (
          <MediaLinksTab
            sections={DUMMY_SHARED_LINKS}
            onOpenLink={handleOpenLink}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
