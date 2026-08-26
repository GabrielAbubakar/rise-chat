import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { UserResponseDto } from "@/features/auth/types";
import { tokenStorage } from "@/services/api/token";
import { createZustandStorage } from "./storage";

interface AuthState {
  user: UserResponseDto | null;
  setUser: (user: UserResponseDto) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        await tokenStorage.clearTokens();
        set({ user: null });
      },
    }),
    {
      name: "auth-state",
      storage: createJSONStorage(() => createZustandStorage("auth-storage")),
    },
  ),
);
