# Rise Chat — Shared Components Documentation

> **Location:** `src/shared/components/`  
> **Architecture:** Reusable, type-safe primitives supporting NativeWind v4, dark mode, dynamic brand theming, and assistive accessibility.

---

## Table of Contents
1. [Layout & Navigation](#1-layout--navigation)
   * [`ScreenContainer`](#11-screencontainer)
   * [`ScreenHeader`](#12-screenheader)
2. [Typography & Actions](#2-typography--actions)
   * [`BaseText`](#21-basetext)
   * [`BaseButton`](#22-basebutton)
   * [`BaseTouchableOpacity`](#23-basetouchableopacity)
3. [Forms & Inputs](#3-forms--inputs)
   * [`BaseInput`](#31-baseinput)
   * [`PhoneInput`](#32-phoneinput)
   * [`OtpInput`](#33-otpinput)
4. [Media & Feedback](#4-media--feedback)
   * [`Avatar`](#41-avatar)
   * [`ToastConfig`](#42-toastconfig)
5. [Sheets & Virtualized Lists](#5-sheets--virtualized-lists)
   * [`BaseBottomSheet`](#51-basebottomsheet)
   * [`BottomSheetLegendList`](#52-bottomsheetlegendlist)
   * [`CountryCodePickerSheet`](#53-countrycodepickersheet)

---

## 1. Layout & Navigation

### 1.1 `ScreenContainer`
* **File:** `src/shared/components/ScreenContainer.tsx`
* **Purpose:** The foundational layout container for all feature screens. Handles safe-area insets, keyboard adjustment (`react-native-keyboard-controller`), and scrollable views seamlessly.

#### Visual States & Capabilities
* **SafeArea Handling:** Automatically adjusts top/bottom spacing on devices with notches and home indicators.
* **Keyboard Management:** Integrates `KeyboardAwareScrollView` with automatic bottom offset to prevent inputs from being obscured.
* **Scroll vs Fixed Canvas:** Toggle between fixed viewport (e.g. Chat details) and scrollable pages (e.g. Settings, Profiles).

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `isSafeArea` | `boolean` | `true` | Wraps children in `SafeAreaView` |
| `isScrollable` | `boolean` | `false` | Enables vertical scroll view |
| `withPadding` | `boolean` | `true` | Insets content with standard `p-6` (`24px`) padding |
| `isKeyboardAvoiding` | `boolean` | `false` | Automatically avoids keyboard when inputs focus |
| `showKeyboardToolbar` | `boolean` | `false` | Renders accessory toolbar above the software keyboard |
| `keyboardBehavior` | `"padding" \| "height" \| "position"` | `"padding"` | Keyboard lift algorithm |
| `contentContainerClassName` | `string` | `""` | Tailwind class applied to the internal scroll content container |

#### Usage Example
```tsx
import { ScreenContainer } from "@/shared/components";

export function ProfileScreen() {
  return (
    <ScreenContainer isScrollable isKeyboardAvoiding withPadding>
      {/* Content here */}
    </ScreenContainer>
  );
}
```

---

### 1.2 `ScreenHeader`
* **File:** `src/shared/components/ScreenHeader.tsx`
* **Purpose:** Top app bar for screens pushed onto the navigation stack. Displays the screen title, back button, and an optional right-aligned action slot.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `undefined` | Header title string |
| `onBack` | `() => void` | `router.back()` | Custom back button action handler |
| `showBackButton`| `boolean` | `true` | Whether the back chevron button is rendered |
| `rightAction` | `React.ReactNode` | `undefined` | Custom component rendered on the right (e.g. Save, Edit) |
| `useSafeArea` | `boolean` | `true` | Insets the top of the header using safe area insets |
| `withPadding` | `boolean` | `true` | Adds horizontal padding |

#### Usage Example
```tsx
import { ScreenHeader, BaseButton } from "@/shared/components";

<ScreenHeader
  title="Security & PIN"
  onBack={() => router.back()}
  rightAction={
    <Pressable onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save settings">
      <BaseText color="primary" weight="bold">Save</BaseText>
    </Pressable>
  }
/>
```

---

## 2. Typography & Actions

### 2.1 `BaseText`
* **File:** `src/shared/components/BaseText.tsx`
* **Purpose:** Primary typography primitive throughout the app. Implements the SF Pro Display scale and automatic dark mode label colors via `tailwind-variants`.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "body-lg" \| "body-md" \| "body-sm" \| "button-big" \| "button-small"` | `"body-md"` | Type hierarchy variant mapping |
| `color` | `"default" \| "primary" \| "primary50" \| "secondary" \| "error"` | `"default"` | Semantic text color token |
| `weight` | `"regular" \| "medium" \| "semibold" \| "bold"` | Derived from type | Explicit font-family weight override |
| `align` | `"auto" \| "left" \| "right" \| "center" \| "justify"` | `"left"` | Text alignment |

#### Usage Example
```tsx
import { BaseText } from "@/shared/components";

<BaseText type="h1">Chats</BaseText>
<BaseText type="body-md" color="secondary">Last seen 5m ago</BaseText>
<BaseText type="body-sm" color="error">Invalid passcode entered</BaseText>
```

---

### 2.2 `BaseButton`
* **File:** `src/shared/components/BaseButton.tsx`
* **Purpose:** Standard high-emphasis action button with native spring press physics (`withSpring`), loading spinner replacement, and accessibility support.

#### Visual States
* **Default:** Branded background using dynamic theme color (`useThemeColors().primary`).
* **Pressed:** Spring scale-down (`0.98`) and subtle opacity dimming.
* **Loading:** Disables touches and displays a white `ActivityIndicator` without shifting layout size.
* **Disabled:** Reduces opacity to `0.5` and rejects click events.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *(Required)* | Button label text |
| `variant` | `"primary" \| "secondary"` | `"primary"` | Filled brand button or neutral/outlined button |
| `loading` | `boolean` | `false` | Shows spinner and locks interaction |
| `disabled` | `boolean` | `false` | Disables interaction and dims opacity |
| `animated` | `boolean` | `false` | Enables Reanimated entry/exit layout animations |

#### Usage Example
```tsx
import { BaseButton } from "@/shared/components";

<BaseButton
  title="Verify & Continue"
  variant="primary"
  loading={isVerifying}
  disabled={code.length < 4}
  onPress={handleSubmit}
  accessibilityLabel="Verify code and continue"
/>
```

---

### 2.3 `BaseTouchableOpacity`
* **File:** `src/shared/components/BaseTouchableOpacity.tsx`
* **Purpose:** Low-level TouchableOpacity wrapper pre-configured with the app's default active opacity (`0.7`) and forwardRef for NativeWind class name styling.

#### Usage Example
```tsx
import { BaseTouchableOpacity } from "@/shared/components";

<BaseTouchableOpacity
  onPress={handleOpen}
  className="p-3 bg-surface dark:bg-surface-dark rounded-xl"
>
  <BaseText>Tap to view</BaseText>
</BaseTouchableOpacity>
```

---

## 3. Forms & Inputs

### 3.1 `BaseInput`
* **File:** `src/shared/components/BaseInput.tsx`
* **Purpose:** Universal single-line text input with animated focus borders, dynamic brand tinting, accessory slots, and error states.

#### Visual States
* **Unfocused:** Subtle divider border (`border-divider dark:border-divider-dark`) with transparent background.
* **Focused:** Border highlights with the active brand primary color; background fills with primary-50 tint in Day mode.
* **Disabled:** Dims input text and reduces container opacity.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `undefined` | Optional top header text |
| `size` | `"default" \| "large"` | `"default"` | Standard height vs oversized text (e.g. PIN entries) |
| `leftComponent` | `React.ReactNode` | `undefined` | Accessory icon or component placed before the text input |
| `InputComponent`| `React.ElementType` | `TextInput` | Custom input component (e.g. `BottomSheetTextInput`) |
| `inputClassName`| `string` | `""` | Tailwind class applied directly to the internal text input |

#### Usage Example
```tsx
import { BaseInput } from "@/shared/components";
import SearchIcon from "@/assets/icons/solid/magnifying-glass.svg";

<BaseInput
  label="Display Name"
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
  leftComponent={<SearchIcon width={20} height={20} color="#9CA3AF" />}
/>
```

---

### 3.2 `PhoneInput`
* **File:** `src/shared/components/PhoneInput.tsx`
* **Purpose:** Specialized international phone number field with flag button, dial code badge, and automated bottom sheet country picker.

#### Behaviors & Features
* **Country Picker Sheet:** Tapping the flag/dial code button dismisses the keyboard and presents `CountryCodePickerSheet`.
* **Sanitization & Validation:** Cleans non-digit characters and computes `isValid` (length >= 10) on every keystroke.
* **Full E.164 Number Format:** Returns both local cleaned number and full international number (e.g. `+2348012345678`).

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | *(Required)* | Local number string without dial code |
| `onChangePhoneNumber` | `(raw: string, full: string, isValid: boolean) => void` | *(Required)* | Change listener returning raw, full number, and validation state |
| `defaultCountryCode` | `string` | `"NG"` | Default 2-letter ISO country code |
| `disabled` | `boolean` | `false` | Disables country picker and input |

#### Usage Example
```tsx
import { PhoneInput } from "@/shared/components";

<PhoneInput
  value={phone}
  onChangePhoneNumber={(raw, full, isValid) => {
    setPhone(raw);
    setIsPhoneValid(isValid);
  }}
  defaultCountryCode="US"
/>
```

---

### 3.3 `OtpInput`
* **File:** `src/shared/components/OtpInput.tsx`
* **Purpose:** Accessible split-box verification code input (4 or 6 digits).

#### Accessibility Architecture
* **Visual Representation:** `length` individual boxes displaying each typed character in `3xl` typography. Boxes highlight on focus and turn red on error.
* **Assistive Tech Accessibility:** Visual boxes are hidden from screen readers (`importantForAccessibility="no-hide-descendants"`). An invisible `TextInput` (`StyleSheet.absoluteFill` with `opacity: 0.01`) overlays the boxes, carrying explicit `accessibilityLabel="Verification code input, 4 digits"`, `accessibilityValue`, and `accessibilityHint`.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `length` | `number` | `4` | Number of digit boxes |
| `value` | `string` | *(Required)* | Currently typed digit string |
| `onChangeText` | `(text: string) => void` | *(Required)* | Change callback receiving filtered numeric string |
| `isError` | `boolean` | `false` | Sets red error border and background tint |

#### Usage Example
```tsx
import { OtpInput } from "@/shared/components";

<OtpInput
  length={4}
  value={otpCode}
  onChangeText={setOtpCode}
  isError={isWrongCode}
/>
```

---

## 4. Media & Feedback

### 4.1 `Avatar`
* **File:** `src/shared/components/Avatar.tsx`
* **Purpose:** Circular avatar primitive with support for remote images, initials, group icons, and active presence status dots.

#### Visual Modes
| Mode | Condition | Rendered Output |
|---|---|---|
| **`image`** | `type === "image" && source` | Fast-cached remote image using `expo-image` |
| **`initials`**| `type === "initials"` | 2-character uppercase monogram centered on brand background |
| **`group`** | `type === "group"` | `Users` multi-user silhouette SVG |
| **`archive`**| `type === "archive"` | `Archive` box SVG |

#### Active Indicator
Setting `isActive={true}` renders an `absolute` bottom-right green circle (`#4ADE80`) with white border ring.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `"image" \| "initials" \| "group" \| "archive"` | `"image"` | Visual mode |
| `source` | `string` | `undefined` | Remote image URL |
| `initials` | `string` | `undefined` | Full name or 2-letter monogram |
| `size` | `number` | `56` | Diameter in points (width & height) |
| `isActive` | `boolean` | `false` | Displays online presence status badge |
| `backgroundColor`| `string` | `theme primary` | Custom background color for monogram/icons |

#### Usage Example
```tsx
import { Avatar } from "@/shared/components";

<Avatar
  type="image"
  source="https://res.cloudinary.com/..."
  size={56}
  isActive={true}
/>
<Avatar
  type="initials"
  initials="Alex Doe"
  size={48}
/>
```

---

### 4.2 `ToastConfig`
* **File:** `src/shared/components/ToastConfig.tsx`
* **Purpose:** Custom configuration passed to `react-native-toast-message` mounted at the app root layout.

#### Variants
* **`success`:** Branded card with a 4px left border matching the user's primary accent color.
* **`error`:** Destructive card with a 4px left border in `red-500`.
* **`info`:** Rounded pill badge with information circle icon.

#### Usage via Global Toast
```tsx
import Toast from "react-native-toast-message";

Toast.show({
  type: "success",
  text1: "Profile Updated",
  text2: "Your changes have been saved successfully.",
});
```

---

## 5. Sheets & Virtualized Lists

### 5.1 `BaseBottomSheet`
* **File:** `src/shared/components/BaseBottomSheet.tsx`
* **Purpose:** Modal bottom sheet component wrapping `@gorhom/bottom-sheet`'s `BottomSheetModal`.

#### Behaviors & Features
* **Automatic Backdrop:** Smooth dimming backdrop with tap-to-dismiss.
* **Dark Mode Theming:** Adapts container background (`neutral-700` in dark, white in light) and handle bar indicator.
* **Hardware Back Handler:** Captures Android hardware back button to dismiss sheet smoothly instead of triggering root screen pops.

#### Props API
| Prop | Type | Default | Description |
|---|---|---|---|
| `snapPoints` | `(string \| number)[]` | `["50%"]` | Array of snap heights (e.g. `["50%", "85%"]`) |
| `onHardwareBackPress` | `() => boolean` | `undefined` | Optional custom hardware back button override |
| `enablePanDownToClose`| `boolean` | `true` | Allows dragging down to dismiss |

#### Usage Example
```tsx
import { BaseBottomSheet } from "@/shared/components";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";

export function Example() {
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <BaseBottomSheet ref={sheetRef} snapPoints={["50%", "80%"]}>
      <View className="p-6">
        <BaseText type="h3">Modal Content</BaseText>
      </View>
    </BaseBottomSheet>
  );
}
```

---

### 5.2 `BottomSheetLegendList`
* **File:** `src/shared/components/BottomSheetLegendList.tsx`
* **Purpose:** Bridges high-performance `@legendapp/list` with `@gorhom/bottom-sheet`'s native scrollable gesture recognizer.

#### When to Use
Use `BottomSheetLegendList` whenever rendering long virtualized lists (e.g. contacts list, member selector) inside a `BaseBottomSheet`. Using standard `LegendList` or `FlatList` inside a sheet causes gesture conflicts with sheet drag handlers.

#### Usage Example
```tsx
import { BottomSheetLegendList } from "@/shared/components";

<BottomSheetLegendList
  data={contacts}
  renderItem={renderContactRow}
  keyExtractor={(item) => item.id}
  estimatedItemSize={72}
/>
```

---

### 5.3 `CountryCodePickerSheet`
* **File:** `src/shared/components/CountryCodePickerSheet.tsx`
* **Purpose:** Standalone searchable modal bottom sheet listing international countries, flag emojis, and dialing codes.

#### Features
* Uses `country-codes-list` with automatic deduplication.
* Real-time search bar filtering across country names and dial codes.
* 300ms debounce to prevent character dropping on software keyboards during fast typing.
* Integrated with `BottomSheetFlatList` for 60fps scrolling.

#### Usage Example
```tsx
import { CountryCodePickerSheet, Country } from "@/shared/components";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";

export function AuthScreen() {
  const sheetRef = useRef<BottomSheetModal>(null);

  const handleSelectCountry = (country: Country) => {
    console.log(country.name, country.dialCode, country.flag);
    sheetRef.current?.dismiss();
  };

  return (
    <CountryCodePickerSheet ref={sheetRef} onSelect={handleSelectCountry} />
  );
}
```
