import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { tokenStorage } from "@/services/api/token";
import { clearPinCode } from "@/services/security/pin";
import { clientPersister, queryClient } from "@/core/queryClient";
import { createZustandStorage } from "./storage";
import { useSecurityStore } from "./useSecurityStore";

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => Promise<void>;
}

const authMMKV = createMMKV({ id: "auth-storage" });

function getInitialAuthState(): { isAuthenticated: boolean } {
  try {
    const raw = authMMKV.getString("auth-state");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        return { isAuthenticated: Boolean(parsed.state.isAuthenticated) };
      }
    }
  } catch {
    // fallback
  }
  return { isAuthenticated: false };
}

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: initialAuth.isAuthenticated,
      setAuthenticated: (status) => {
        set({ isAuthenticated: status });
      },
      logout: async () => {
        tokenStorage.incrementSessionGeneration();
        await tokenStorage.clearTokens();
        await clearPinCode();
        useSecurityStore.getState().reset();
        queryClient.clear();
        await clientPersister.removeClient();
        set({ isAuthenticated: false });
      },
    }),
    {
      name: "auth-state",
      storage: createJSONStorage(() => createZustandStorage("auth-storage")),
    },
  ),
);
