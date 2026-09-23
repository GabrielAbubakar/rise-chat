import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { mediaApi } from "@/features/media/api";
import axios from "axios";
import { generateUUID, showApiErrorToast } from "@/shared/utils";
import { chatsApi } from "../api";
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
  BottomSheetScrollView,
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

import CameraIcon from "@/assets/icons/solid/add-a-photo.svg";
import CheckIcon from "@/assets/icons/solid/check.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import { useThemeColors } from "@/shared/hooks";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  useCreateGroup,
  useMatchContacts,
  useSearchUsers,
} from "../hooks/useChats";
import { ContactMatchDto } from "../types";
import { ContactItem } from "./NewChatBottomSheet";

export type NewGroupBottomSheetProps = object;

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

export const NewGroupBottomSheet = forwardRef<
  BottomSheetModal,
  NewGroupBottomSheetProps
>((props, ref) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { primary, primaryShades } = useThemeColors();

  const snapPoints = useMemo(() => ["85%"], []);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAvatarUri, setGroupAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking avatar:", error);
    }
  };

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<ContactMatchDto[]>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus | null>(null);

  const [resetKey, setResetKey] = useState(0); // Used to remount uncontrolled inputs on dismiss

  const matchContactsMutation = useMatchContacts({
    onSuccess: (data) => {
      setMatchedUsers(data.matches || []);
    },
  });

  const createGroupMutation = useCreateGroup();

  const handleCreateGroup = async () => {
    const participantIds = Array.from(selectedParticipants);
    if (groupName.trim() === "" || participantIds.length === 0) return;

    try {
      if (groupAvatarUri) {
        setIsUploadingAvatar(true);
      }
      
      const conversation = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        participantIds: participantIds,
      });

      if (groupAvatarUri) {
        try {
          const type = groupAvatarUri.endsWith(".png")
            ? "image/png"
            : groupAvatarUri.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg";

          const uploadAuth = await mediaApi.createUpload({
            clientUploadId: generateUUID(),
            purpose: "group_avatar",
            contentType: type as any,
            sizeBytes: 500000,
            originalFilename: `avatar_${Date.now()}.jpg`,
          });

          if (uploadAuth.upload) {
            const formData = new FormData();
            if (uploadAuth.upload.fields) {
              Object.entries(uploadAuth.upload.fields).forEach(([key, val]) => {
                formData.append(key, String(val));
              });
            }

            formData.append("file", {
              uri: groupAvatarUri,
              name: `avatar_${Date.now()}.jpg`,
              type: type,
            } as any);

            await axios.post(uploadAuth.upload.url, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            await mediaApi.completeUpload(uploadAuth.media.id);
            await chatsApi.setGroupAvatar(conversation.id, { mediaId: uploadAuth.media.id });
          }
        } catch (error: any) {
          showApiErrorToast(error, "Failed to upload group photo");
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      (ref as any)?.current?.dismiss();
      setTimeout(() => {
        setStep(1);
        setSelectedParticipants(new Set());
        setGroupName("");
        setGroupDescription("");
        setSearchQuery("");
        setGroupAvatarUri(null);
        setResetKey((prev) => prev + 1);
        router.push(`/chat/${conversation.id}`);
      }, 300);

    } catch (e) {
      setIsUploadingAvatar(false);
    }
  };

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

          setContacts(mappedContacts);

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

  const processedContacts = useMemo(() => {
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

      return Array.from(map.values());
    }

    return localFiltered;
  }, [processedContacts, deferredSearchQuery, globalSearchResults]);

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

  const renderStep1 = () => (
    <>
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
              searchQuery.length > 0 ? primary : isDark ? "#6E8597" : "#9CA3AF"
            }
            className="mr-2"
          />
        }
      />

      {permissionStatus === "denied" ? (
        <View className="flex-1 items-center justify-center px-10">
          <BaseText className="text-center text-neutral-500 dark:text-neutral-400 font-sf-medium">
            Contacts permission is required to find and add your friends. Please
            enable it in your device settings.
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
        />
      )}

      <View className="py-4 mt-auto">
        <BaseButton title="Next" onPress={() => setStep(2)} />
      </View>
    </>
  );

  const renderStep2 = () => (
    <View className="flex-1">
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-6">
          <Pressable className="relative" onPress={handlePickAvatar}>
            <View
              className="w-32 h-32 rounded-full items-center justify-center overflow-hidden border border-neutral-100 dark:border-neutral-700"
              style={{
                backgroundColor: isDark ? "#F5FEF8" : primaryShades[50],
              }}
            >
              {groupAvatarUri ? (
                <Image
                  source={groupAvatarUri}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <CameraIcon width={36} height={36} color={primary} />
              )}
            </View>
          </Pressable>
        </View>

        <View className="flex-1">
          <BaseInput
            key={`name-${resetKey}`}
            label="Name of group"
            placeholder="Name group"
            defaultValue=""
            onChangeText={setGroupName}
            InputComponent={BottomSheetTextInput}
          />

          <BaseInput
            key={`desc-${resetKey}`}
            label="Description (Optional)"
            placeholder="Type description..."
            defaultValue=""
            onChangeText={setGroupDescription}
            InputComponent={BottomSheetTextInput}
            multiline
            numberOfLines={4}
            inputClassName="min-h-[80px]"
            style={{ textAlignVertical: "top" }}
          />
        </View>
      </BottomSheetScrollView>

      <View className="py-4 mt-auto">
        <BaseButton
          title={createGroupMutation.isPending || isUploadingAvatar ? "Creating..." : "Create"}
          disabled={
            createGroupMutation.isPending || isUploadingAvatar || groupName.trim().length === 0
          }
          onPress={handleCreateGroup}
        />
      </View>
    </View>
  );

  return (
    <BaseBottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onHardwareBackPress={() => {
        if (step === 2) {
          setStep(1);
          return true; // Prevent default, stay open but go back a step
        }
        return false; // let it close normally
      }}
      onDismiss={() => {
        setTimeout(() => {
          setStep(1);
          setSelectedParticipants(new Set());
          setGroupName("");
          setGroupDescription("");
          setSearchQuery("");
          setGroupAvatarUri(null);
          setIsUploadingAvatar(false);
          setResetKey((prev) => prev + 1);
        }, 300);
      }}
    >
      <View className="flex-1 px-6 pt-4">
        <View className={`items-center ${step === 1 ? "mb-6" : "mb-10"}`}>
          <BaseText type="h4" className="font-sf-bold mb-5">
            {step === 1 ? "Add participants" : "New Group"}
            {step === 1 && selectedParticipants.size > 0 && (
              <BaseText type="h4" style={{ color: primaryShades[400] }}>
                {" "}
                ({selectedParticipants.size})
              </BaseText>
            )}
          </BaseText>

          <View className="flex-row items-center justify-center gap-2">
            <View
              className="h-1 flex-1 rounded-full"
              style={{
                opacity: step >= 1 ? 1 : 0.3,
                backgroundColor: primaryShades[400],
              }}
            />
            <View
              className="h-1 flex-1 rounded-full"
              style={{
                opacity: step >= 2 ? 1 : 0.3,
                backgroundColor: primaryShades[400],
              }}
            />
          </View>
        </View>

        {step === 1 ? renderStep1() : renderStep2()}
      </View>
    </BaseBottomSheet>
  );
});

NewGroupBottomSheet.displayName = "NewGroupBottomSheet";
