# Rise Chat — Design System Documentation

> **Version:** 1.0.0  
> **Target Framework:** React Native (Expo SDK 57), NativeWind v4 (Tailwind CSS), React Native Reanimated v4, `@gorhom/bottom-sheet` v5.

---

## 1. Introduction & Design Philosophy

Rise Chat’s design system is engineered to provide an elegant, ultra-fast, native messaging experience across iOS and Android. It draws heavily from Human Interface Guidelines (HIG) and Material Design 3 while retaining a distinctive, focused brand identity.

### Core Principles
1. **Native-First Responsiveness:** Zero-lag touch responses, native spring physics, and 60/120 FPS gesture-driven interactions using Reanimated and Gesture Handler.
2. **Deep Dual-Mode Theming:** First-class Day (Light) and Night (Dark) mode representations where colors are intentionally mapped rather than inverted.
3. **Dynamic User Accents:** Instantaneous, runtime-swappable accent color schemes (Green, Blue, Red, Orange) without app reloads.
4. **Assistive Tech by Default:** Accessible roles, descriptive screen reader labels, VoiceOver/TalkBack action alternatives for gestures, and accessible input models.
5. **Composability via Shared Primitives:** Screens assemble pre-tested, standardized components (`ScreenContainer`, `BaseText`, `BaseButton`, `Avatar`, `BaseBottomSheet`) rather than reinventing ad-hoc UI.

---

## 2. Foundations & Design Tokens

Design tokens reside canonically in `src/shared/constants/tokens.ts`, `src/shared/constants/themes.ts`, and `tailwind.config.js`.

### 2.1 Color Palette

#### Semantic UI Colors
| Token | Tailwind Class | Light Mode (`day`) | Dark Mode (`night`) | Description / Usage |
|---|---|---|---|---|
| **App Background** | `bg-app`, `dark:bg-app-dark` | `#F5F7F9` | `#081C2C` | Default screen background canvas |
| **Surface** | `bg-surface`, `dark:bg-surface-dark` | `#FFFFFF` | `#163043` | Cards, bottom sheets, message bubbles, modals |
| **Divider / Border** | `border-divider`, `dark:border-divider-dark` | `#EAEEF2` | `#1F3C51` | Subtle separators, card outlines, list borders |
| **Primary Label** | `text-label`, `dark:text-label-dark` | `#000000` | `#FFFFFF` | Primary headings, contact names, body titles |
| **Secondary Label**| `text-neutral-500`, `dark:text-neutral-300` | `#3A566A` | `#6E8597` | Timestamps, subtitles, secondary status copy |

#### Neutral Scale
* `neutral-50`: `#DDE2E8` (Light borders, pill backgrounds)
* `neutral-300`: `#6E8597` (Muted labels in dark mode, inactive icons)
* `neutral-500`: `#3A566A` (Default secondary neutral)
* `neutral-600`: `#1F3C51` (Dark card borders, secondary actions)
* `neutral-700`: `#163043` (Dark surfaces, elevated items)
* `neutral-800`: `#0C2436` (Dark input backgrounds, action containers)
* `neutral-900`: `#081C2C` (Deep dark background base)

#### Dynamic Accent Color Themes (`COLOR_SCHEMES`)
Users can configure their favorite primary accent. Components access this dynamically via `useThemeColors().primary`:

| Theme ID | Shade 50 | Shade 200 | Shade 400 (DEFAULT) | Primary Role |
|---|---|---|---|---|
| **`green` (Brand)** | `#DDF1E5` | `#ABDBBE` | `#57B77D` | Default Rise Chat green brand accent |
| **`blue`** | `#ECF5FF` | `#80BDFF` | `#007CFF` | Modern iOS/system blue accent |
| **`red`** | `#FADCD8` | `#F4A79D` | `#E8503A` | Coral/rose red accent |
| **`orange`** | `#FFF0D9` | `#FFD89F` | `#FFB23F` | Warm amber/orange accent |

#### State & Feedback Colors
* **Success / Online:** `#4ADE80` (Active avatar status dot, delivered confirmation)
* **Destructive / Error:** `#EF4444` / `red-500` (Delete actions, form validation error, unread error)
* **Informational:** `#3B82F6` (Toast notifications, system updates)
* **Pending / In-Flight:** Opacity `0.6` with spinner / clock icon

---

### 2.2 Typography System

The application uses Apple's **SF Pro Display** typeface family bundled in `assets/fonts/sf-pro-display/`.

#### Font Family Definitions
* `font-sf-regular` / `font-text`: `SFProDisplay-Regular`
* `font-sf-medium`: `SFProDisplay-Medium`
* `font-sf-semibold`: `SFProDisplay-Semibold`
* `font-sf-bold` / `font-display`: `SFProDisplay-Bold`

#### Type Hierarchy Scale
| Hierarchy Type | Font Size | Line Height | Weight | Tailwind Classes |
|---|---|---|---|---|
| **Display / H1** | `32px` | `1.25` | Bold (`700`) | `text-h1 font-sf-bold` |
| **H2 (Screen Titles)** | `28px` | `1.25` | Bold (`700`) | `text-h2 font-sf-bold` |
| **H3 (Section Headers)**| `24px` | `1.25` | Bold (`700`) | `text-h3 font-sf-bold` |
| **H4 (Item Titles)** | `20px` | `1.25` | Bold (`700`) | `text-h4 font-sf-bold` |
| **H5 / Subheader** | `16px` | `1.25` | Bold (`700`) | `text-h5 font-sf-bold` |
| **H6 / Tiny Header** | `14px` | `1.25` | Bold (`700`) | `text-h6 font-sf-bold` |
| **Body Large** | `16px` | `1.5` | Regular (`400`) | `text-body-lg font-sf-regular` |
| **Body Medium (Default)**| `14px` | `1.5` | Regular (`400`) | `text-body-md font-sf-regular` |
| **Body Small (Captions)** | `12px` | `1.5` | Regular (`400`) | `text-body-sm font-sf-regular` |
| **Button Big** | `14px` | `1.5` | Bold (`700`) | `text-button-big font-sf-bold` |
| **Button Small** | `12px` | `1.5` | Bold (`700`) | `text-button-small font-sf-bold` |

---

### 2.3 Spacing, Radius, and Elevation

#### Spacing Scale (8pt Baseline Grid)
* `gap-1` / `p-1`: `4px` (Micro spacing, badges)
* `gap-2` / `p-2`: `8px` (Icon to text spacing, tight rows)
* `gap-3` / `p-3`: `12px` (Composer padding, badge margins)
* `gap-4` / `p-4`: `16px` (Standard card padding, list item horizontal inset)
* `gap-6` / `p-6`: `24px` (Screen container horizontal gutter)
* `gap-8` / `p-8`: `32px` (Section spacing)

#### Border Radius Standards
* `rounded-lg` (`8px`): Swipeable action buttons, media previews, toast cards.
* `rounded-xl` (`12px`): Input fields, secondary cards, message bubbles.
* `rounded-2xl` (`16px`): Primary action buttons, bottom sheet containers, dialogs.
* `rounded-[24px]` (`24px`): Chat composer input pill bar.
* `rounded-full` (`9999px`): Avatars, floating action buttons (FAB), status badges, icon buttons.

---

## 3. Core Shared Components

> 📖 **Full Components Specification:** See [**`docs/components.md`**](./components.md) for full props tables, visual states, and complete code examples for every shared component.

All shared components reside in `src/shared/components/`:

### Component Overview
| Component | Primary Role & Features | Documentation |
|---|---|---|
| [`ScreenContainer`](./components.md#11-screencontainer) | Base screen wrapper managing safe area, `KeyboardAwareScrollView`, and scroll layout. | [Docs](./components.md#11-screencontainer) |
| [`ScreenHeader`](./components.md#12-screenheader) | Standardized stack navigation top bar with back navigation and right action slots. | [Docs](./components.md#12-screenheader) |
| [`BaseText`](./components.md#21-basetext) | Type-safe SF Pro Display typography primitive with automated dark/light mode label colors. | [Docs](./components.md#21-basetext) |
| [`BaseButton`](./components.md#22-basebutton) | Primary & secondary call-to-action button with native spring physics and loading spinner. | [Docs](./components.md#22-basebutton) |
| [`BaseTouchableOpacity`](./components.md#23-basetouchableopacity) | Standardized touchable wrapper with active opacity `0.7` and NativeWind class support. | [Docs](./components.md#23-basetouchableopacity) |
| [`BaseInput`](./components.md#31-baseinput) | Form text input with focus highlight border, brand tint, and accessory icon slots. | [Docs](./components.md#31-baseinput) |
| [`PhoneInput`](./components.md#32-phoneinput) | International phone input with flag dial-code selector and E.164 number formatting. | [Docs](./components.md#32-phoneinput) |
| [`OtpInput`](./components.md#33-otpinput) | Accessible 4/6-digit verification code input with hidden overlay input and screen reader support. | [Docs](./components.md#33-otpinput) |
| [`Avatar`](./components.md#41-avatar) | Multi-mode circular avatar (remote image, initials monogram, group icon, archive icon, active dot). | [Docs](./components.md#41-avatar) |
| [`ToastConfig`](./components.md#42-toastconfig) | Custom stylized global toast configurations (success, error, info) for `react-native-toast-message`. | [Docs](./components.md#42-toastconfig) |
| [`BaseBottomSheet`](./components.md#51-basebottomsheet) | Modal bottom sheet with dynamic theming, backdrop dimming, and hardware back button handling. | [Docs](./components.md#51-basebottomsheet) |
| [`BottomSheetLegendList`](./components.md#52-bottomsheetlegendlist) | Virtualized 60fps LegendList integrated with bottom sheet gesture recognition. | [Docs](./components.md#52-bottomsheetlegendlist) |
| [`CountryCodePickerSheet`](./components.md#53-countrycodepickersheet) | Searchable modal sheet listing international country codes with debounced search. | [Docs](./components.md#53-countrycodepickersheet) |

---

## 4. Feature UI Component Patterns

### 4.1 Chat Conversation List (`ChatItem`)
* **Item Layout:** 56px Avatar (left) + Display Name & Preview (center) + Time & Unread Badge / Pin (right).
* **Gestures & Swipe Actions (`ReanimatedSwipeable`):**
  * **Swipe Left:** Mute / Unmute (Orange) with duration options + Pin / Unpin (Neutral).
  * **Swipe Right:** Delete (Direct, Red) or Clear Messages (Group, Red) with confirmation dialogs + Archive (Neutral).
* **Accessibility:** Full `accessibilityActions` (`activate`, `mute`, `archive`, `pin`, `delete`/`clear`) for screen reader access without swiping.

### 4.2 Chat Composer (`ChatInputBar`)
* **Layout:** Pill-shaped `rounded-[24px]` input bar.
* **Paperclip Icon:** Opens `AttachmentPickerMenu` (Camera, Photo Library, Documents).
* **Expanding Input:** Multiline `TextInput` auto-growing up to `max-h-[120px]`.
* **Send Button:** Dynamic circle button tinted in brand primary color with activity spinner during sending.

### 4.3 Chat Message Bubbles (`ChatMessageItem` & `MessagePill`)
* **Outgoing (Me):** Aligned right, bubble styled with dynamic primary accent color, white text.
* **Incoming (Other):** Aligned left, white (Day) or dark slate surface (Night), dark/light text.
* **Attachments:** Rich previews for Photos, Videos, and Documents (`AttachmentItem`) with upload progress and stage-aware error indicators.
* **Delivery Frontiers:** Dynamic status icons: Pending (Clock) ➔ Sent (Single check) ➔ Delivered (Double check) ➔ Read (Blue/Green double check).

### 4.4 Bottom Sheets (`BaseBottomSheet`)
Powered by `@gorhom/bottom-sheet`:
* `NewChatBottomSheet`: Contact discovery list with alphabetic sections.
* `NewGroupBottomSheet`: Multi-contact selector with group name & avatar upload.
* `CountryCodePickerSheet`: Searchable international dial codes with flags.

---

## 5. Icons & Asset Conventions

Icons are authored as SVG files in `assets/icons/`:
* `assets/icons/solid/*.svg`
* `assets/icons/outline/*.svg`

Icons are imported directly as React components via `react-native-svg-transformer`:
```tsx
import PaperClipIcon from "@/assets/icons/solid/paper-clip.svg";

<PaperClipIcon width={24} height={24} color="#57B77D" />
```

### Icon Sizing Matrix
* **Micro (Status / Receipts):** `14px` - `16px`
* **Small (Input icons, menu items):** `20px`
* **Default (Buttons, headers, tabs):** `24px`
* **Large (Empty states, locks):** `32px` - `48px`

---

## 6. Theming & Dark Mode Workflow

```
       ┌──────────────────────────────┐
       │   useThemeStore (Zustand)    │
       │  - themePreference (sys/l/d) │
       │  - primaryColor (g/b/r/o)    │
       └──────────────┬───────────────┘
                      │
       ┌──────────────┴───────────────┐
       ▼                              ▼
NativeWind `colorScheme`      `useThemeColors()`
(Tailwind `dark:` classes)    (Dynamic primary hex token)
```

### Best Practice Rule
1. **Backgrounds, Surfaces, Borders, Labels:** Always use standard Tailwind semantic classes with `dark:` variants:
   ```tsx
   className="bg-app dark:bg-app-dark text-label dark:text-label-dark border-divider dark:border-divider-dark"
   ```
2. **Primary Brand Accents:** Obtain from `useThemeColors()`:
   ```tsx
   const { primary } = useThemeColors();
   return <View style={{ backgroundColor: primary }} />;
   ```

---

## 7. Component Checklist for Developers

When contributing a new screen or component to Rise Chat:
- [ ] Uses `ScreenContainer` or `ScreenHeader` for standard layout structure.
- [ ] Employs `BaseText` rather than raw React Native `<Text>`.
- [ ] Employs `BaseButton` for primary or secondary call-to-action buttons.
- [ ] Applies both Day and Night styling (`dark:` modifiers on all surfaces and text).
- [ ] Connects accent colors via `useThemeColors().primary`.
- [ ] Adds `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityState` to all icon-only buttons.
- [ ] Verifies touch targets meet the minimum **44x44 pt** recommendation (e.g. via `hitSlop`).
