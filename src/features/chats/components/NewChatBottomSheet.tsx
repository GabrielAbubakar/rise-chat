import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetSectionList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { forwardRef, useMemo, useState, useRef, useImperativeHandle } from "react";
import { Pressable, View } from "react-native";

// Icons
import ChevronRightIcon from "@/assets/icons/solid/cheveron-right.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import { colors } from "@/shared/constants";
import { useColorScheme } from "nativewind";
import { DUMMY_CONTACTS } from "@/constants/dummyData";
import { Avatar, BaseText, BaseInput, BaseBottomSheet } from "@/shared/components";

export const NewChatBottomSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const innerRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useImperativeHandle(ref, () => innerRef.current as BottomSheetModal);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Snap points
  const snapPoints = useMemo(() => ["85%"], []);

  // Filter and group contacts
  const filteredContacts = useMemo(() => {
    return DUMMY_CONTACTS.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const groupedContacts = useMemo(() => {
    const groups = filteredContacts.reduce(
      (acc, contact) => {
        const firstLetter = contact.name[0].toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(contact);
        return acc;
      },
      {} as Record<string, typeof DUMMY_CONTACTS>,
    );

    return Object.keys(groups)
      .sort()
      .map((key) => ({
        title: key,
        data: groups[key],
      }));
  }, [filteredContacts]);

  const renderContact = ({ item }: { item: (typeof DUMMY_CONTACTS)[0] }) => (
    <Pressable className="flex-row items-center py-3 px-6 bg-white dark:bg-app-dark">
      <View className="mr-4">
        <Avatar type="image" source={item.avatar} size={48} />
      </View>
      <View className="flex-1">
        <BaseText className="text-neutral-900 dark:text-white font-sf-bold text-base">
          {item.name}
        </BaseText>
        <BaseText className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
          {item.phone}
        </BaseText>
      </View>
      <ChevronRightIcon
        width={20}
        height={20}
        color={isDark ? "#6E8597" : "#9CA3AF"}
      />
    </Pressable>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View className="bg-neutral-100 dark:bg-neutral-800 px-6 py-2">
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
            InputComponent={BottomSheetTextInput}
            value={searchQuery}
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

        {/* Lists */}
        {searchQuery.length > 0 ? (
          <BottomSheetFlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <BottomSheetSectionList
            sections={groupedContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 40 }}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </BaseBottomSheet>
  );
});

NewChatBottomSheet.displayName = "NewChatBottomSheet";
