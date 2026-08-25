import { DUMMY_CONTACTS } from "@/constants/dummyData";
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
import { forwardRef, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import CameraIcon from "@/assets/icons/solid/add-a-photo.svg";
import CheckIcon from "@/assets/icons/solid/check.svg";
import SearchIcon from "@/assets/icons/solid/search.svg";
import { colors } from "@/shared/constants";
import { useColorScheme } from "nativewind";

export type NewGroupBottomSheetProps = {};

export const NewGroupBottomSheet = forwardRef<
  BottomSheetModal,
  NewGroupBottomSheetProps
>((props, ref) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const snapPoints = useMemo(() => ["85%"], []);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const renderStep1 = () => (
    <>
      <BaseInput
        InputComponent={BottomSheetTextInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search people..."
        className="mb-6 py-[12px]"
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

      <BottomSheetFlatList
        data={DUMMY_CONTACTS.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        keyExtractor={(item) => item.id}
        numColumns={4}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedParticipants.includes(item.id);
          return (
            <Pressable
              onPress={() => toggleParticipant(item.id)}
              className="items-center w-16"
            >
              <View className="relative mb-2">
                <View
                  className={`rounded-full overflow-hidden ${isSelected ? "border-2 border-primary-400" : "border-2 border-transparent"}`}
                >
                  <Avatar type="image" source={item.avatar} size={52} />
                </View>
                {isSelected && (
                  <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center m-[2px]">
                    <View
                      className="w-6 h-6 bg-primary-400 items-center justify-center"
                      style={{ borderRadius: 12 }}
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
        }}
      />

      <View className="py-4 mt-auto">
        <BaseButton title="Next" onPress={() => setStep(2)} />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View className="items-center mb-10">
        <View className="relative">
          <View className="w-32 h-32 rounded-full dark:bg-[#F5FEF8] bg-primary-50 items-center justify-center overflow-hidden border border-neutral-100 dark:border-neutral-700">
            <CameraIcon width={36} height={36} color="#4ADE80" />
          </View>
        </View>
      </View>

      <View className="flex-1">
        <BaseInput
          label="Name of group"
          placeholder="Name group"
          value={groupName}
          onChangeText={setGroupName}
          InputComponent={BottomSheetTextInput}
        />

        <BaseInput
          label="Description (Optional)"
          placeholder="Type description..."
          value={groupDescription}
          onChangeText={setGroupDescription}
          InputComponent={BottomSheetTextInput}
          multiline
          numberOfLines={4}
          inputClassName="min-h-[80px]"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      <View className="py-4 mt-auto">
        <BaseButton
          title="Create"
          onPress={() => {
            console.log("Create Group", {
              groupName,
              groupDescription,
              selectedParticipants,
            });
            (ref as any)?.current?.dismiss();
            // Reset state after closing animation
            setTimeout(() => {
              setStep(1);
              setSelectedParticipants([]);
              setGroupName("");
              setGroupDescription("");
              setSearchQuery("");
            }, 300);
          }}
        />
      </View>
    </>
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
          setSelectedParticipants([]);
          setGroupName("");
          setGroupDescription("");
          setSearchQuery("");
        }, 300);
      }}
    >
      <View className="flex-1 px-6 pt-4">
        <View className={`items-center ${step === 1 ? "mb-6" : "mb-10"}`}>
          <BaseText type="h4" className="font-sf-bold mb-5">
            {step === 1 ? "Add participants" : "New Group"}
            {step === 1 && selectedParticipants.length > 0 && (
              <BaseText type="h4" style={{ color: colors.primary[400] }}>
                {" "}
                ({selectedParticipants.length})
              </BaseText>
            )}
          </BaseText>

          <View className="flex-row items-center justify-center gap-2">
            <View
              className="h-1 flex-1 rounded-full bg-primary-400"
              style={{ opacity: step >= 1 ? 1 : 0.3 }}
            />
            <View
              className="h-1 flex-1 rounded-full bg-primary-400"
              style={{ opacity: step >= 2 ? 1 : 0.3 }}
            />
          </View>
        </View>

        {step === 1 ? renderStep1() : renderStep2()}
      </View>
    </BaseBottomSheet>
  );
});

NewGroupBottomSheet.displayName = "NewGroupBottomSheet";
