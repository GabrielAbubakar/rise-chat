import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createZustandStorage } from "./storage";

interface SecurityState {
  hasSeenPinPrompt: boolean;
  hasSkippedPinSetup: boolean;
  isPinSet: boolean;
  isAppUnlocked: boolean;
  isBiometricsEnabled: boolean;
  markPinPromptSeen: () => void;
  markPinSetupSkipped: () => void;
  setPinStatus: (status: boolean) => void;
  setAppUnlocked: (unlocked: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const securityMMKV = createMMKV({ id: "security-storage" });

function getInitialSecurityState(): {
  hasSeenPinPrompt: boolean;
  hasSkippedPinSetup: boolean;
  isPinSet: boolean;
  isBiometricsEnabled: boolean;
} {
  try {
    const raw = securityMMKV.getString("security-state");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        const hasSeen = Boolean(
          parsed.state.hasSeenPinPrompt ?? parsed.state.hasSkippedPinSetup,
        );
        return {
          hasSeenPinPrompt: hasSeen,
          hasSkippedPinSetup: hasSeen,
          isPinSet: Boolean(parsed.state.isPinSet),
          isBiometricsEnabled: Boolean(parsed.state.isBiometricsEnabled),
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    hasSeenPinPrompt: false,
    hasSkippedPinSetup: false,
    isPinSet: false,
    isBiometricsEnabled: false,
  };
}

const initialSecurity = getInitialSecurityState();

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      hasSeenPinPrompt: initialSecurity.hasSeenPinPrompt,
      hasSkippedPinSetup: initialSecurity.hasSkippedPinSetup,
      isPinSet: initialSecurity.isPinSet,
      isAppUnlocked: false,
      isBiometricsEnabled: initialSecurity.isBiometricsEnabled,
      markPinPromptSeen: () =>
        set({ hasSeenPinPrompt: true, hasSkippedPinSetup: true }),
      markPinSetupSkipped: () =>
        set({ hasSeenPinPrompt: true, hasSkippedPinSetup: true }),
      setPinStatus: (status) =>
        set((state) => ({
          isPinSet: status,
          hasSeenPinPrompt: status ? true : state.hasSeenPinPrompt,
          hasSkippedPinSetup: status ? true : state.hasSkippedPinSetup,
        })),
      setAppUnlocked: (unlocked) => set({ isAppUnlocked: unlocked }),
      setBiometricsEnabled: (enabled) => set({ isBiometricsEnabled: enabled }),
      reset: () =>
        set({
          hasSeenPinPrompt: false,
          hasSkippedPinSetup: false,
          isPinSet: false,
          isAppUnlocked: false,
          isBiometricsEnabled: false,
        }),
    }),
    {
      name: "security-state",
      storage: createJSONStorage(() => createZustandStorage("security-storage")),
      partialize: (state) => ({
        // We only persist these. isAppUnlocked should always reset on fresh launch (cold start)
        hasSeenPinPrompt: state.hasSeenPinPrompt,
        hasSkippedPinSetup: state.hasSkippedPinSetup,
        isPinSet: state.isPinSet,
        isBiometricsEnabled: state.isBiometricsEnabled,
      }),
    },
  ),
);
