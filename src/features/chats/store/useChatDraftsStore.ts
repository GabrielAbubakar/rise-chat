import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { SelectedAttachment } from "../components";

const storage = createMMKV({ id: "chat-drafts-storage" });
const DRAFTS_KEY = "chat_drafts_v1";

export interface ChatDraft {
  text: string;
  attachment: SelectedAttachment | null;
}

interface ChatDraftsStoreState {
  drafts: Record<string, ChatDraft>;
  getDraft: (conversationId: string) => ChatDraft | undefined;
  setDraft: (
    conversationId: string,
    text: string,
    attachment: SelectedAttachment | null,
  ) => void;
  clearDraft: (conversationId: string) => void;
}

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

  getDraft: (conversationId: string) => {
    return get().drafts[conversationId];
  },

  setDraft: (conversationId: string, text: string, attachment: SelectedAttachment | null) => {
    set((state) => {
      const nextDrafts = { ...state.drafts };
      if (!text.trim() && !attachment) {
        delete nextDrafts[conversationId];
      } else {
        nextDrafts[conversationId] = { text, attachment };
      }
      persistDrafts(nextDrafts);
      return { drafts: nextDrafts };
    });
  },

  clearDraft: (conversationId: string) => {
    set((state) => {
      if (!state.drafts[conversationId]) return state;
      const nextDrafts = { ...state.drafts };
      delete nextDrafts[conversationId];
      persistDrafts(nextDrafts);
      return { drafts: nextDrafts };
    });
  },
}));
