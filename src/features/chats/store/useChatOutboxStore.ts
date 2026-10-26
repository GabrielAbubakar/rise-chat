import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { SelectedAttachment } from "../components";

const storage = createMMKV({ id: "chat-outbox-storage" });
const OUTBOX_KEY = "chat_outbox_v1";

export interface OutboxEntry {
  clientMessageId: string;
  conversationId: string;
  text?: string;
  attachment?: SelectedAttachment | null;
  uploadedMediaId?: string;
  status: "pending" | "failed" | "sent";
  createdAt: string;
  error?: string;
}

interface ChatOutboxStoreState {
  entries: Record<string, OutboxEntry>;
  addOutboxEntry: (entry: OutboxEntry) => void;
  updateOutboxStatus: (
    clientMessageId: string,
    status: "pending" | "failed" | "sent",
    updates?: { uploadedMediaId?: string; error?: string },
  ) => void;
  removeOutboxEntry: (clientMessageId: string) => void;
  getOutboxEntry: (clientMessageId: string) => OutboxEntry | undefined;
  getConversationOutbox: (conversationId: string) => OutboxEntry[];
}

function loadInitialOutbox(): Record<string, OutboxEntry> {
  try {
    const raw = storage.getString(OUTBOX_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load outbox from storage", e);
  }
  return {};
}

function persistOutbox(entries: Record<string, OutboxEntry>) {
  try {
    storage.set(OUTBOX_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to persist outbox to storage", e);
  }
}

export const useChatOutboxStore = create<ChatOutboxStoreState>((set, get) => ({
  entries: loadInitialOutbox(),

  addOutboxEntry: (entry: OutboxEntry) => {
    set((state) => {
      const nextEntries = { ...state.entries, [entry.clientMessageId]: entry };
      persistOutbox(nextEntries);
      return { entries: nextEntries };
    });
  },

  updateOutboxStatus: (
    clientMessageId: string,
    status: "pending" | "failed" | "sent",
    updates?: { uploadedMediaId?: string; error?: string },
  ) => {
    set((state) => {
      const existing = state.entries[clientMessageId];
      if (!existing) return state;

      const updated: OutboxEntry = {
        ...existing,
        status,
        uploadedMediaId: updates?.uploadedMediaId ?? existing.uploadedMediaId,
        error: updates?.error ?? existing.error,
      };

      const nextEntries = { ...state.entries, [clientMessageId]: updated };
      persistOutbox(nextEntries);
      return { entries: nextEntries };
    });
  },

  removeOutboxEntry: (clientMessageId: string) => {
    set((state) => {
      if (!state.entries[clientMessageId]) return state;
      const nextEntries = { ...state.entries };
      delete nextEntries[clientMessageId];
      persistOutbox(nextEntries);
      return { entries: nextEntries };
    });
  },

  getOutboxEntry: (clientMessageId: string) => {
    return get().entries[clientMessageId];
  },

  getConversationOutbox: (conversationId: string) => {
    return Object.values(get().entries).filter(
      (entry) => entry.conversationId === conversationId,
    );
  },
}));
