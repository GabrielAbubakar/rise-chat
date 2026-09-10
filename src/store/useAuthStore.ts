import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { UserResponseDto } from "@/features/auth/types";
import { tokenStorage } from "@/services/api/token";
import { clientPersister, queryClient } from "@/core/queryClient";
import { createZustandStorage } from "./storage";

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuthenticated: (status) => {
        set({ isAuthenticated: status });
      },
      logout: async () => {
        await tokenStorage.clearTokens();
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
