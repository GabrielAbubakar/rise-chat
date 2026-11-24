import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createZustandStorage } from "./storage";

interface AppState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  pendingRoute: string | null;
  setPendingRoute: (route: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      pendingRoute: null,
      setPendingRoute: (route) => set({ pendingRoute: route }),
    }),
    {
      name: "app-state",
      storage: createJSONStorage(() => createZustandStorage("app-storage")),
    },
  ),
);
