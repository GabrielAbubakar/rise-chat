import {
  BottomSheetModal,
  BottomSheetSectionList,
  BottomSheetTextInput
} from "@gorhom/bottom-sheet";
import * as Contacts from "expo-contacts/legacy";
import { useRouter } from "expo-router";
import {
  forwardRef,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

// Icons
import ChevronRightIcon from "@/assets/icons/solid/cheveron-right.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import {
  Avatar,
  BaseBottomSheet,
  BaseInput,
  BaseText,
} from "@/shared/components";
import { useColorScheme } from "nativewind";
import {
  useCreateDirectConversation,
  useMatchContacts,
  useSearchUsers,
} from "../hooks/useChats";
import { ContactMatchDto } from "../types";

export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  participantId?: string;
}

export const NewChatBottomSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const innerRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [localContacts, setLocalContacts] = useState<ContactItem[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<ContactMatchDto[]>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);

  const [resetKey, setResetKey] = useState(0);

  useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Snap points
  const snapPoints = useMemo(() => ["85%"], []);

  // API Mutations and Queries
  const matchContactsMutation = useMatchContacts({
    onSuccess: (data) => {
      setMatchedUsers(data.matches || []);
    },
  });

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { data: globalSearchResults, isLoading: isGlobalSearching } =
    useSearchUsers(
      { q: deferredSearchQuery },
      { enabled: deferredSearchQuery.trim().length >= 3 },
    );

  const createDirectMutation = useCreateDirectConversation({
    onSuccess: (conversation) => {
      setSelectedParticipantId(null);
      innerRef.current?.dismiss();
      router.push(`/chat/${conversation.id}`);
    },
    onError: () => {
      setSelectedParticipantId(null);
    },
  });

  // Read local device contacts and run /contacts/match API
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });

        if (data.length > 0) {
          const mappedContacts: ContactItem[] = data
            .filter((c) => c.name)
            .map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phoneNumbers?.[0]?.number,
              avatar: c.imageAvailable && c.image ? c.image.uri : undefined,
            }));

          setLocalContacts(mappedContacts);

          // Collect phone numbers to match on backend
          const phoneNumbers = data
            .flatMap((c) => c.phoneNumbers?.map((p) => p.number))
            .filter((num): num is string => Boolean(num));

          if (phoneNumbers.length > 0) {
            matchContactsMutation.mutate({ phoneNumbers });
          }
        }
      }
    })();
  }, []);

  // Map local contacts with matched user data
  const processedContacts = useMemo(() => {
    const matchedPhoneMap = new Map<string, string>();
    matchedUsers.forEach((m) => {
      if (m.matchedPhoneNumber) {
        // Normalize digits for matching
        const cleanPhone = m.matchedPhoneNumber.replace(/\D/g, "");
        matchedPhoneMap.set(cleanPhone, m.user.id);
      }
    });

    return localContacts.map((c) => {
      const cleanPhone = (c.phone || "").replace(/\D/g, "");
      const participantId = cleanPhone
        ? matchedPhoneMap.get(cleanPhone)
        : undefined;
      return {
        ...c,
        participantId: participantId || c.participantId,
      };
    });
  }, [localContacts, matchedUsers]);

  // Section list data when search is empty
  const defaultSections = useMemo(() => {
    const registered = processedContacts.filter((c) =>
      Boolean(c.participantId),
    );
    const others = processedContacts.filter((c) => !c.participantId);

    const sections = [];
    if (registered.length > 0) {
      sections.push({
        title: "Contacts on Rise Chat",
        data: registered,
      });
    }

    // Group remaining alphabetically
    const groups = others.reduce(
      (acc, contact) => {
        const firstLetter = (contact.name?.[0] || "#").toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(contact);
        return acc;
      },
      {} as Record<string, ContactItem[]>,
    );

    const alphabetical = Object.keys(groups)
      .sort()
      .map((key) => ({
        title: key,
        data: groups[key],
      }));

    return [...sections, ...alphabetical];
  }, [processedContacts]);

  // Section list data when searching (>= 3 chars)
  const searchSections = useMemo(() => {
    if (deferredSearchQuery.length < 3) return [];

    const localFiltered = processedContacts.filter((c) =>
      c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
    );

    const globalItems: ContactItem[] =
      globalSearchResults?.items?.map((user) => ({
        id: `global-${user.id}`,
        name: user.displayName || "User",
        avatar: user.avatarUrl || undefined,
        participantId: user.id,
      })) || [];

    const sections = [];
    if (localFiltered.length > 0) {
      sections.push({
        title: "Your Contacts",
        data: localFiltered,
      });
    }

    if (globalItems.length > 0) {
      sections.push({
        title: "Global Search",
        data: globalItems,
      });
    }

    return sections;
  }, [deferredSearchQuery, processedContacts, globalSearchResults]);

  const handleSelectContact = (item: ContactItem) => {
    if (item.participantId) {
      setSelectedParticipantId(item.participantId);
      createDirectMutation.mutate({ participantId: item.participantId });
    }
  };

  const renderContact = ({ item }: { item: ContactItem }) => {
    const isCreating =
      createDirectMutation.isPending &&
      selectedParticipantId === item.participantId;

    return (
      <Pressable
        onPress={() => handleSelectContact(item)}
        disabled={!item.participantId || createDirectMutation.isPending}
        className={`flex-row items-center py-3 px-6 bg-white dark:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-800 ${
          !item.participantId ? "opacity-60" : ""
        }`}
      >
        <View className="mr-4">
          <Avatar
            type={item.avatar ? "image" : "initials"}
            source={item.avatar}
            initials={item.name.charAt(0)}
            size={48}
          />
        </View>
        <View className="flex-1">
          <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-base">
            {item.name}
          </BaseText>
          {item.phone ? (
            <BaseText className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
              {item.phone}
            </BaseText>
          ) : item.participantId ? (
            <BaseText className="text-primary-500 font-sf-medium text-xs mt-0.5">
              Rise Chat User
            </BaseText>
          ) : null}
        </View>
        {isCreating ? (
          <ActivityIndicator size="small" color="#4ADE80" />
        ) : item.participantId ? (
          <ChevronRightIcon
            width={20}
            height={20}
            color={isDark ? "#6E8597" : "#9CA3AF"}
          />
        ) : null}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View className="bg-neutral-100 dark:bg-neutral-500 px-6 py-2">
      <BaseText className="text-neutral-500 dark:text-neutral-400 font-sf-bold text-sm">
        {title}
      </BaseText>
    </View>
  );

  return (
    <BaseBottomSheet
      ref={innerRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={() => {
        setSearchQuery("");
        setResetKey((prev) => prev + 1);
      }}
    >
      <View className="flex-1">
        {/* Header Title */}
        <View className="items-center py-4">
          <BaseText
            type="h3"
            className="font-sf-bold text-neutral-900 dark:text-white"
          >
            New Chat
          </BaseText>
        </View>

        {/* Search Input */}
        <View className="px-6 pb-4">
          <BaseInput
            key={`search-${resetKey}`}
            InputComponent={BottomSheetTextInput}
            defaultValue=""
            onChangeText={setSearchQuery}
            placeholder="Search people..."
            className="mb-0 py-[12px]"
            leftComponent={
              <SearchIcon
                width={20}
                height={20}
                color={
                  searchQuery.length > 0
                    ? "#4ADE80"
                    : isDark
                      ? "#6E8597"
                      : "#9CA3AF"
                }
                className="mr-2"
              />
            }
          />
        </View>

        {/* Permission Denied Fallback */}
        {permissionStatus === "denied" ? (
          <View className="flex-1 items-center justify-center px-10">
            <BaseText className="text-center text-neutral-500 dark:text-neutral-400 font-sf-medium">
              Contacts permission is required to find and add your friends.
              Please enable it in your device settings.
            </BaseText>
          </View>
        ) : deferredSearchQuery.length >= 3 ? (
          isGlobalSearching ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#4ADE80" />
            </View>
          ) : (
            <BottomSheetSectionList
              sections={searchSections}
              keyExtractor={(item) => item.id}
              renderItem={renderContact}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={{ paddingBottom: 40 }}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <BottomSheetSectionList
            sections={defaultSections}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 40 }}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BaseBottomSheet>
  );
});

NewChatBottomSheet.displayName = "NewChatBottomSheet";
