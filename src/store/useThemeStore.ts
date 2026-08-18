import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createZustandStorage } from "./storage";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: "system",
      setThemePreference: (theme) => set({ themePreference: theme }),
    }),
    {
      name: "theme-preference",
      storage: createJSONStorage(() => createZustandStorage("theme-storage")),
    },
  ),
);
