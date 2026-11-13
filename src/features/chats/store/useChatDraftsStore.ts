import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { SelectedAttachment } from "../components";

const storage = createMMKV({ id: "chat-drafts-storage" });
const DRAFTS_KEY = "chat_drafts_v1";

export interface ChatDraft {
  ownerId: string;
  conversationId: string;
  text: string;
  attachment: SelectedAttachment | null;
}

interface ChatDraftsStoreState {
  drafts: Record<string, ChatDraft>;
  getDraft: (ownerId: string, conversationId: string) => ChatDraft | undefined;
  setDraft: (
    ownerId: string,
    conversationId: string,
    text: string,
    attachment: SelectedAttachment | null,
  ) => void;
  clearDraft: (ownerId: string, conversationId: string) => void;
  clearActiveSession: (ownerId?: string) => void;
}

export const getDraftKey = (ownerId: string, conversationId: string) =>
  `${ownerId || "anonymous"}:${conversationId}`;

function loadInitialDrafts(): Record<string, ChatDraft> {
  try {
    const raw = storage.getString(DRAFTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load drafts from storage", e);
  }
  return {};
}

function persistDrafts(drafts: Record<string, ChatDraft>) {
  try {
    storage.set(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error("Failed to persist drafts to storage", e);
  }
}

export const useChatDraftsStore = create<ChatDraftsStoreState>((set, get) => ({
  drafts: loadInitialDrafts(),

  getDraft: (ownerId: string, conversationId: string) => {
    const key = getDraftKey(ownerId, conversationId);
    return get().drafts[key];
  },

  setDraft: (
    ownerId: string,
    conversationId: string,
    text: string,
    attachment: SelectedAttachment | null,
  ) => {
    set((state) => {
      const key = getDraftKey(ownerId, conversationId);
      const nextDrafts = { ...state.drafts };
      if (!text.trim() && !attachment) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = { ownerId, conversationId, text, attachment };
      }
      persistDrafts(nextDrafts);
      return { drafts: nextDrafts };
    });
  },

  clearDraft: (ownerId: string, conversationId: string) => {
    set((state) => {
      const key = getDraftKey(ownerId, conversationId);
      if (!state.drafts[key]) return state;
      const nextDrafts = { ...state.drafts };
      delete nextDrafts[key];
      persistDrafts(nextDrafts);
      return { drafts: nextDrafts };
    });
  },

  clearActiveSession: (ownerId?: string) => {
    set((state) => {
      if (!ownerId) {
        return { drafts: {} };
      }
      const nextDrafts = { ...state.drafts };
      Object.keys(nextDrafts).forEach((key) => {
        if (nextDrafts[key].ownerId === ownerId) {
          delete nextDrafts[key];
        }
      });
      persistDrafts(nextDrafts);
      return { drafts: nextDrafts };
    });
  },
}));
