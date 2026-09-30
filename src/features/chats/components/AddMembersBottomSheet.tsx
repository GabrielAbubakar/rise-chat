import {
  Avatar,
  BaseBottomSheet,
  BaseButton,
  BaseInput,
  BaseText,
} from "@/shared/components";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import * as Contacts from "expo-contacts/legacy";
import React, {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import CheckIcon from "@/assets/icons/solid/check.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import { useThemeColors } from "@/shared/hooks";
import { showInfoToast } from "@/shared/utils";
import { useColorScheme } from "nativewind";
import { useMatchContacts, useSearchUsers } from "../hooks/useChats";
import { useAddGroupMembers } from "../hooks/useGroupActions";
import { ContactMatchDto } from "../types";
import { ContactItem } from "./NewChatBottomSheet";

export interface AddMembersBottomSheetProps {
  conversationId: string;
  existingParticipantIds: string[];
}

interface GroupContactCardProps {
  item: ContactItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const GroupContactCard = React.memo(
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

export const AddMembersBottomSheet = forwardRef<
  BottomSheetModal,
  AddMembersBottomSheetProps
>((props, ref) => {
  const { conversationId, existingParticipantIds } = props;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { primary, primaryShades } = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const snapPoints = useMemo(() => ["85%"], []);

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<ContactMatchDto[]>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus | null>(null);

  const [resetKey, setResetKey] = useState(0);

  const { mutate: matchContacts } = useMatchContacts({
    onSuccess: (data) => {
      setMatchedUsers(data.matches || []);
    },
  });

  const addMembersMutation = useAddGroupMembers(conversationId);

  const handleAddMembers = async () => {
    const participantIds = Array.from(selectedParticipants);
    if (participantIds.length === 0) return;

    try {
      await addMembersMutation.mutateAsync({
        participantIds,
      });

      showInfoToast("Members added successfully");

      (ref as any)?.current?.dismiss();
      setTimeout(() => {
        setSelectedParticipants(new Set());
        setSearchQuery("");
        setResetKey((prev) => prev + 1);
      }, 300);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (!isMounted) return;
        setPermissionStatus(status);

        if (status === "granted") {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          });
          if (!isMounted) return;

          if (data.length > 0) {
            const mappedContacts: ContactItem[] = data
              .filter((c) => c.name)
              .map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phoneNumbers?.[0]?.number,
                avatar: c.imageAvailable && c.image ? c.image.uri : undefined,
              }));

            setContacts(mappedContacts);

            const phoneNumbers = data
              .flatMap((c) => c.phoneNumbers?.map((p) => p.number))
              .filter((num): num is string => Boolean(num));

            if (phoneNumbers.length > 0) {
              matchContacts({ phoneNumbers });
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch contacts", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isOpen, matchContacts]);

  const processedContacts = useMemo<ContactItem[]>(() => {
    const matchedPhoneMap = new Map<string, string>();
    matchedUsers.forEach((m) => {
      if (m.matchedPhoneNumber) {
        const cleanPhone = m.matchedPhoneNumber.replace(/\D/g, "");
        matchedPhoneMap.set(cleanPhone, m.user.id);
      }
    });

    return contacts.map((c) => {
      const cleanPhone = (c.phone || "").replace(/\D/g, "");
      const participantId = cleanPhone
        ? matchedPhoneMap.get(cleanPhone)
        : undefined;
      return {
        ...c,
        participantId: participantId || c.participantId,
      };
    });
  }, [contacts, matchedUsers]);

  const toggleParticipant = useCallback((id: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { data: globalSearchResults, isLoading: isGlobalSearching } =
    useSearchUsers(
      { q: deferredSearchQuery },
      { enabled: deferredSearchQuery.trim().length >= 3 },
    );

  const filteredContacts = useMemo(() => {
    const localFiltered = processedContacts.filter((c) =>
      c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()),
    );

    let allItems: ContactItem[] = localFiltered;

    if (deferredSearchQuery.trim().length >= 3) {
      const globalItems: ContactItem[] =
        globalSearchResults?.items?.map((user) => ({
          id: `global-${user.id}`,
          name: user.displayName || "User",
          avatar: user.avatarUrl || undefined,
          participantId: user.id,
        })) || [];

      // Combine and remove duplicates by participantId
      const map = new Map<string, ContactItem>();
      localFiltered.forEach((c) => {
        if (c.participantId) {
          map.set(c.participantId, c);
        } else {
          map.set(c.id, c);
        }
      });
      globalItems.forEach((c) => {
        if (c.participantId) {
          map.set(c.participantId, c);
        }
      });

      allItems = Array.from(map.values());
    }

    // Filter out users already in the group
    const existingSet = new Set(existingParticipantIds);
    return allItems.filter(
      (c) => !c.participantId || !existingSet.has(c.participantId),
    );
  }, [
    processedContacts,
    deferredSearchQuery,
    globalSearchResults,
    existingParticipantIds,
  ]);

  const renderContact = useCallback(
    ({ item }: { item: ContactItem }) => {
      const idToToggle = item.participantId || item.id;
      return (
        <GroupContactCard
          item={item}
          isSelected={selectedParticipants.has(idToToggle)}
          onToggle={toggleParticipant}
        />
      );
    },
    [selectedParticipants, toggleParticipant],
  );

  return (
    <BaseBottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onChange={(index) => setIsOpen(index >= 0)}
      onDismiss={() => {
        setTimeout(() => {
          setSelectedParticipants(new Set());
          setSearchQuery("");
          setResetKey((prev) => prev + 1);
        }, 300);
      }}
    >
      <View className="flex-1 px-6 pt-4">
        <View className="items-center mb-6">
          <BaseText type="h4" className="font-sf-bold mb-5">
            Add participants
            {selectedParticipants.size > 0 && (
              <BaseText type="h4" style={{ color: primaryShades[400] }}>
                {" "}
                ({selectedParticipants.size})
              </BaseText>
            )}
          </BaseText>
        </View>

        <BaseInput
          key={`search-${resetKey}`}
          InputComponent={BottomSheetTextInput}
          defaultValue=""
          onChangeText={setSearchQuery}
          placeholder="Search people..."
          className="mb-6 py-[12px]"
          leftComponent={
            <SearchIcon
              width={20}
              height={20}
              color={
                searchQuery.length > 0
                  ? primary
                  : isDark
                    ? "#6E8597"
                    : "#9CA3AF"
              }
              className="mr-2"
            />
          }
        />

        {permissionStatus === "denied" ? (
          <View className="flex-1 items-center justify-center px-10">
            <BaseText className="text-center text-neutral-500 dark:text-neutral-400 font-sf-medium">
              Contacts permission is required to find and add your friends.
              Please enable it in your device settings.
            </BaseText>
          </View>
        ) : isGlobalSearching ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="small" color={primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            numColumns={4}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={renderContact}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-8">
                <BaseText className="text-neutral-500">No users found</BaseText>
              </View>
            )}
          />
        )}

        <View className="py-4 mt-auto">
          <BaseButton
            title={
              addMembersMutation.isPending
                ? "Adding..."
                : `Add ${selectedParticipants.size > 0 ? selectedParticipants.size : ""} Members`
            }
            disabled={
              addMembersMutation.isPending || selectedParticipants.size === 0
            }
            onPress={handleAddMembers}
          />
        </View>
      </View>
    </BaseBottomSheet>
  );
});

AddMembersBottomSheet.displayName = "AddMembersBottomSheet";
