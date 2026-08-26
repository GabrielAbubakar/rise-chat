import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createZustandStorage } from "./storage";

interface SecurityState {
  hasSkippedPinSetup: boolean;
  isPinSet: boolean;
  isAppUnlocked: boolean;
  markPinSetupSkipped: () => void;
  setPinStatus: (status: boolean) => void;
  setAppUnlocked: (unlocked: boolean) => void;
  reset: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      hasSkippedPinSetup: false,
      isPinSet: false,
      isAppUnlocked: false,
      markPinSetupSkipped: () => set({ hasSkippedPinSetup: true }),
      setPinStatus: (status) => set({ isPinSet: status }),
      setAppUnlocked: (unlocked) => set({ isAppUnlocked: unlocked }),
      reset: () =>
        set({ hasSkippedPinSetup: false, isPinSet: false, isAppUnlocked: false }),
    }),
    {
      name: "security-state",
      storage: createJSONStorage(() => createZustandStorage("security-storage")),
      partialize: (state) => ({
        // We only persist these. isAppUnlocked should always reset on fresh launch (cold start)
        hasSkippedPinSetup: state.hasSkippedPinSetup,
        isPinSet: state.isPinSet,
      }),
    },
  ),
);
