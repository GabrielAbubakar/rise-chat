import { clientPersister, queryClient } from "@/core/queryClient";
import { useChatDraftsStore } from "@/features/chats/store/useChatDraftsStore";
import { useChatOutboxStore } from "@/features/chats/store/useChatOutboxStore";
import { abortAllUploads } from "@/features/media/services/uploadService";
import { tokenStorage } from "@/services/api/token";
import { clearPinCode } from "@/services/security/pin";
import { trackSessionCleanup } from "@/services/session/cleanupBarrier";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createZustandStorage } from "./storage";
import { useSecurityStore } from "./useSecurityStore";

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  /** Resolves once native cleanup has settled; never rejects. */
  logout: () => Promise<{ failedSteps: string[] }>;
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
        // Phase 1 — synchronous, before any await (R6).
        // End ownership first so every in-flight request, mutation, token read
        // and upload from this session is discarded, then detach all private
        // UI/cache/local state. Nothing below can be blocked by native storage.
        tokenStorage.endSession();
        abortAllUploads();
        queryClient.clear();
        useChatDraftsStore.getState().clearActiveSession();
        useChatOutboxStore.getState().clearActiveSession();
        useSecurityStore.getState().reset();
        set({ isAuthenticated: false });

        // Phase 2 — native cleanup. Each step runs independently so one failure
        // can't skip the others. Tracked by the cleanup barrier so a newer
        // session's token/PIN writes wait for these deletes instead of being
        // erased by them.
        const steps: [name: string, run: () => Promise<unknown> | unknown][] = [
          ["credentials", () => tokenStorage.deletePersistedTokens()],
          ["pin", () => clearPinCode()],
          ["query-persister", () => clientPersister.removeClient()],
        ];
        const cleanup = trackSessionCleanup(
          Promise.allSettled(steps.map(([, run]) => Promise.resolve().then(run))),
        );
        const results = await cleanup;

        const failed = results
          .map((r, i) => (r.status === "rejected" ? { step: steps[i][0], reason: r.reason } : null))
          .filter((f): f is { step: string; reason: unknown } => f !== null);
        if (failed.length > 0) {
          // Credentials: the purge marker stays set, so the next launch retries
          // the delete instead of restoring this account's tokens.
          // PIN: security state is already reset (isPinSet=false), so the stale
          // PIN is never checked and is overwritten by the next PIN setup.
          // Persister: the cleared in-memory cache is re-persisted empty.
          console.warn("⚠️ [Auth Module] Logout cleanup incomplete:", failed);
        }
        return { failedSteps: failed.map((f) => f.step) };
      },
    }),
    {
      name: "auth-state",
      storage: createJSONStorage(() => createZustandStorage("auth-storage")),
    },
  ),
);
