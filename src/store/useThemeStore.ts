import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PrimaryColorTheme } from "../shared/constants/themes";
import { createZustandStorage } from "./storage";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  primaryColor: PrimaryColorTheme;
  setPrimaryColor: (color: PrimaryColorTheme) => void;
  appIcon: string;
  setAppIcon: (icon: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: "system",
      setThemePreference: (theme) => set({ themePreference: theme }),
      primaryColor: "green",
      setPrimaryColor: (color) => set({ primaryColor: color }),
      appIcon: "green",
      setAppIcon: (icon) => set({ appIcon: icon }),
    }),
    {
      name: "theme-preference",
      storage: createJSONStorage(() => createZustandStorage("theme-storage")),
    },
  ),
);
