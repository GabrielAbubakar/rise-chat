# Theming and Color Scheming in Rise Chat

Rise Chat features a robust and customizable design system that supports both **Day/Night Mode** (Light/Dark theming) and dynamic **Primary Color Schemes** (Green, Blue, Red, Orange).

This document explains how both systems work together and how to correctly implement styles in new components.

---

## 1. Day / Night Mode (Theming)

The Light and Dark mode system is powered natively by **NativeWind v2** and standard Tailwind CSS classes.

### How it Works
1. **CSS Variables (`src/global.css`)**: 
   Semantic colors for backgrounds, surfaces, text, and dividers are defined using CSS custom properties. We define a baseline in `:root` for Light Mode and override those properties in the `.dark` class selector for Dark Mode.
2. **Tailwind Config (`tailwind.config.js`)**: 
   These variables are mapped to the Tailwind theme config, creating semantic utility classes like `bg-app`, `bg-surface`, and `text-label`.
3. **NativeWind Application**:
   NativeWind listens to the device's color scheme (or user overrides). In your components, you can use the standard `dark:` modifier to swap colors, e.g., `className="bg-app dark:bg-app-dark"`.

---

## 2. Dynamic Primary Color Schemes

Users can choose their preferred accent color (Green, Blue, Red, Orange) for the app. 

### Why a Custom Hook?
NativeWind v2 evaluates Tailwind classes like `bg-primary` into fixed React Native StyleSheet objects at compile time. It maps `bg-primary` to the static `var(--color-primary-DEFAULT)` defined in `global.css`. Because React Native doesn't natively support dynamic runtime CSS custom properties, changing the CSS variable at runtime won't automatically re-render components styled with `className="bg-primary"`.

To solve this and achieve smooth, instantaneous color swapping across the app without reloading, we use a hybrid approach driven by a global store and a custom hook.

### How it Works
1. **Theme Definitions (`src/shared/constants/themes.ts`)**: 
   Contains the exact hex codes for our supported primary colors (Green, Blue, Red, Orange).
2. **Global Store (`src/store/useThemeStore.ts`)**: 
   A Zustand store that persists the user's selected primary color ID.
3. **Custom Hook (`src/shared/hooks/useThemeColors.ts`)**: 
   This hook reads the active color ID from the store and maps it to the actual hex value. It also checks the active Light/Dark mode and returns the appropriate color tokens.

### How to Use the Primary Color

When building components that need to adapt to the user's selected primary color, **do not** use static Tailwind classes like `text-primary` or `bg-primary`.

Instead, import `useThemeColors` and apply the color via inline styles or React Native props.

#### ✅ Correct Usage (Dynamic)

```tsx
import { View, ActivityIndicator } from "react-native";
import { useThemeColors } from "@/shared/hooks";
import StarIcon from "@/assets/icons/solid/star.svg";

export function MyComponent() {
  // 1. Get the dynamic primary color from the hook
  const { primary } = useThemeColors();

  return (
    <View>
      {/* 2. Pass it to SVG icons */}
      <StarIcon width={24} height={24} color={primary} />

      {/* 3. Pass it to standard React Native props */}
      <ActivityIndicator size="large" color={primary} />

      {/* 4. Use inline styles for dynamic backgrounds */}
      <View 
        className="w-10 h-10 rounded-full" 
        style={{ backgroundColor: primary }} 
      />
    </View>
  );
}
```

#### ❌ Incorrect Usage (Static)
The following will be permanently stuck on the default Green color defined in `global.css` and will ignore the user's color scheme preference:

```tsx
// ❌ Don't pass hardcoded hex values
<StarIcon color="#57B77D" />

// ❌ Don't rely on Tailwind primary classes for dynamic swapping
<View className="bg-primary text-primary" />
```

---

## Summary Cheat Sheet

| Requirement | Approach | Example |
|---|---|---|
| **Light / Dark Backgrounds** | Tailwind `dark:` modifier | `className="bg-white dark:bg-neutral-800"` |
| **Light / Dark Text** | Tailwind `dark:` modifier | `className="text-black dark:text-white"` |
| **Dynamic Primary Backgrounds** | `useThemeColors` + Inline styles | `style={{ backgroundColor: primary }}` |
| **Dynamic Primary Text / Icons**| `useThemeColors` + Props/Styles | `color={primary}` |
