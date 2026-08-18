import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable } from "react-native";
import { BaseInput, BaseInputProps } from "./BaseInput";
import { BaseText } from "./BaseText";
import { Country, CountryCodePickerSheet } from "./CountryCodePickerSheet";

export interface PhoneInputProps extends Omit<
  BaseInputProps,
  "value" | "onChangeText"
> {
  value: string;
  onChangePhoneNumber: (
    rawNumber: string,
    fullNumber: string,
    isValid: boolean,
  ) => void;
  defaultCountryCode?: string;
}

export function PhoneInput({
  value,
  onChangePhoneNumber,
  defaultCountryCode = "NG",
  ...props
}: PhoneInputProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: "Nigeria",
    dialCode: "234",
    code: "NG",
    flag: "🇳🇬",
  });

  const handleChangeText = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^\d]/g, "");

    // Basic validation, e.g. >= 10 for most numbers
    const isValid = cleaned.length >= 10;

    const fullNumber = `+${selectedCountry.dialCode}${cleaned}`;
    onChangePhoneNumber(cleaned, fullNumber, isValid);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    
    const cleaned = value ? value.replace(/[^\d]/g, "") : "";
    const isValid = cleaned.length >= 10;
    const fullNumber = `+${country.dialCode}${cleaned}`;
    
    onChangePhoneNumber(cleaned, fullNumber, isValid);
  };

  return (
    <>
      <BaseInput
        {...props}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="phone-pad"
        leftComponent={
          <Pressable
            hitSlop={10}
            className="flex-row items-center border-r border-divider dark:border-divider-dark pr-3 mr-3"
            onPress={() => {
              Keyboard.dismiss();
              bottomSheetRef.current?.present();
            }}
          >
            <BaseText className="text-2xl mr-2">
              {selectedCountry.flag}
            </BaseText>
            <BaseText className="text-lg text-black dark:text-white">
              +{selectedCountry.dialCode}
            </BaseText>
          </Pressable>
        }
      />
      <CountryCodePickerSheet
        ref={bottomSheetRef}
        onSelect={handleCountrySelect}
      />
    </>
  );
}
