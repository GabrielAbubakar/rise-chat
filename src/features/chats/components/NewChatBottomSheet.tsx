import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetSectionList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import * as Contacts from "expo-contacts/legacy";
import {
  forwardRef,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, View } from "react-native";

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

export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export const NewChatBottomSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const innerRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus | null>(null);

  const [resetKey, setResetKey] = useState(0);

  useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Snap points
  const snapPoints = useMemo(() => ["85%"], []);

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
            .filter((c) => c.name) // Ensure they have a name
            .map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phoneNumbers?.[0]?.number,
              avatar: c.imageAvailable && c.image ? c.image.uri : undefined,
            }));

          setContacts(mappedContacts);
        }
      }
    })();
  }, []);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter and group contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
    );
  }, [contacts, deferredSearchQuery]);

  const groupedContacts = useMemo(() => {
    const groups = filteredContacts.reduce(
      (acc, contact) => {
        const firstLetter = (contact.name?.[0] || "#").toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(contact);
        return acc;
      },
      {} as Record<string, ContactItem[]>,
    );

    return Object.keys(groups)
      .sort()
      .map((key) => ({
        title: key,
        data: groups[key],
      }));
  }, [filteredContacts]);

  const renderContact = ({ item }: { item: ContactItem }) => (
    <Pressable className="flex-row items-center py-3 px-6 bg-white dark:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-800">
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
        {item.phone && (
          <BaseText className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
            {item.phone}
          </BaseText>
        )}
      </View>
      <ChevronRightIcon
        width={20}
        height={20}
        color={isDark ? "#6E8597" : "#9CA3AF"}
      />
    </Pressable>
  );

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
            Contact
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
        ) : /* Lists */
        deferredSearchQuery.length > 0 ? (
          <BottomSheetFlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <BottomSheetSectionList
            sections={groupedContacts}
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
