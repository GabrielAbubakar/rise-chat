import { useThemeColors } from "@/shared/hooks";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { customArray } from "country-codes-list";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { ListRenderItem, Pressable, View } from "react-native";
import { BaseText } from "./BaseText";

export interface Country {
  name: string;
  dialCode: string;
  code: string;
  flag: string;
}

// Generate country data with deduplication (some codes might have multiple entries, but customArray handles basics)
const allCountries: Country[] = customArray({
  name: "{countryNameEn}",
  dialCode: "{countryCallingCode}",
  code: "{countryCode}",
  flag: "{flag}",
}) as unknown as Country[];

interface CountryCodePickerSheetProps {
  onSelect: (country: Country) => void;
}

export const CountryCodePickerSheet = forwardRef<
  BottomSheetModal,
  CountryCodePickerSheetProps
>(({ onSelect }, ref) => {
  const colors = useThemeColors();
  const snapPoints = useMemo(() => ["80%", "50%"], []);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the actual filtering so the JS thread doesn't stutter while typing,
  // which prevents the BottomSheetTextInput from dropping/duplicating characters.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredCountries = useMemo(() => {
    if (!debouncedSearch) return allCountries;
    const lowerSearch = debouncedSearch.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.dialCode.includes(lowerSearch),
    );
  }, [debouncedSearch]);

  const handleSelect = useCallback(
    (country: Country) => {
      onSelect(country);
      if (ref && "current" in ref && ref.current) {
        (ref as any).current.dismiss();
      }
    },
    [onSelect, ref],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const renderItem: ListRenderItem<Country> = useCallback(
    ({ item }) => (
      <Pressable
        className="flex-row items-center p-4 border-b border-divider dark:border-divider-dark active:bg-neutral-200 dark:active:bg-neutral-800"
        onPress={() => handleSelect(item)}
      >
        <BaseText className="text-3xl mr-4">{item.flag}</BaseText>
        <View className="flex-1">
          <BaseText
            type="body-md"
            className="font-bold text-black dark:text-white"
          >
            {item.name}
          </BaseText>
          <BaseText type="body-sm" className="text-gray-500 dark:text-gray-400">
            +{item.dialCode}
          </BaseText>
        </View>
      </Pressable>
    ),
    [handleSelect],
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.appBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.bottomSheetIndicator }}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <View className="flex-1 bg-app dark:bg-neutral-900 pb-8">
        <View className="px-4 py-2 border-b border-divider dark:border-divider-dark">
          <BottomSheetTextInput
            placeholder="Search country or code..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            className="bg-transparent border border-divider dark:border-divider-dark text-black dark:text-white p-3 rounded-xl text-lg"
          />
        </View>
        <BottomSheetFlatList
          data={filteredCountries}
          keyExtractor={(item, index) => `${item.code}-${index}`}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </View>
    </BottomSheetModal>
  );
});

CountryCodePickerSheet.displayName = "CountryCodePickerSheet";
