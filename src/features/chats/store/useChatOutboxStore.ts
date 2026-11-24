import { UploadStage } from "@/features/media/services/uploadService";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { SelectedAttachment } from "../components";

const storage = createMMKV({ id: "chat-outbox-storage" });
const OUTBOX_KEY = "chat_outbox_v1";

export type OutboxUploadStage = UploadStage;

export interface OutboxEntry {
  clientMessageId: string;
  ownerId: string;
  conversationId: string;
  text?: string;
  attachment?: SelectedAttachment | null;
  clientUploadId?: string;
  uploadedMediaId?: string;
  uploadStage?: OutboxUploadStage;
  status: "pending" | "failed" | "sent";
  createdAt: string;
  error?: string;
  /** Set on hydration when the app was terminated while this send was pending. */
  interrupted?: boolean;
}

interface ChatOutboxStoreState {
  entries: Record<string, OutboxEntry>;
  addOutboxEntry: (entry: OutboxEntry) => void;
  updateOutboxStatus: (
    clientMessageId: string,
    status: "pending" | "failed" | "sent",
    updates?: {
      uploadedMediaId?: string;
      clientUploadId?: string;
      uploadStage?: OutboxUploadStage;
      error?: string;
    },
  ) => void;
  removeOutboxEntry: (clientMessageId: string) => void;
  getOutboxEntry: (clientMessageId: string) => OutboxEntry | undefined;
  getConversationOutbox: (
    ownerId: string,
    conversationId: string,
  ) => OutboxEntry[];
  getAllOutboxEntries: (ownerId?: string) => OutboxEntry[];
  clearActiveSession: (ownerId?: string) => void;
}

export const INTERRUPTED_SEND_ERROR =
  "Sending was interrupted. Tap retry to send.";

/**
 * R7: the outbox is loaded once per process, so any entry still "pending" at
 * load time belonged to a process that was terminated mid-send — nothing in
 * this process is working on it. Mark it failed + interrupted so the room
 * shows a Retry affordance. Payload, IDs and upload checkpoint are kept so
 * Retry resumes from the last confirmed stage. Confirmed ("sent") entries are
 * dropped: the server owns them now.
 */
export function normalizeHydratedOutbox(
  entries: Record<string, OutboxEntry>,
): Record<string, OutboxEntry> {
  const next: Record<string, OutboxEntry> = {};
  Object.values(entries).forEach((entry) => {
    if (!entry?.clientMessageId || entry.status === "sent") return;
    next[entry.clientMessageId] =
      entry.status === "pending"
        ? {
            ...entry,
            status: "failed",
            interrupted: true,
            error: INTERRUPTED_SEND_ERROR,
          }
        : entry;
  });
  return next;
}

function loadInitialOutbox(): Record<string, OutboxEntry> {
  try {
    const raw = storage.getString(OUTBOX_KEY);
    if (raw) {
      const normalized = normalizeHydratedOutbox(JSON.parse(raw));
      persistOutbox(normalized);
      return normalized;
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
    updates?: {
      uploadedMediaId?: string;
      clientUploadId?: string;
      uploadStage?: OutboxUploadStage;
      error?: string;
    },
  ) => {
    set((state) => {
      const existing = state.entries[clientMessageId];
      if (!existing) return state;
      // Server confirmation is final: a late HTTP failure (e.g. a lost
      // response after the socket already delivered the message) must not
      // turn a delivered message back into a failed one.
      if (existing.status === "sent" && status !== "sent") return state;

      const updated: OutboxEntry = {
        ...existing,
        status,
        // A new attempt in this process supersedes the interruption
        interrupted: status === "pending" ? undefined : existing.interrupted,
        clientUploadId: updates?.clientUploadId ?? existing.clientUploadId,
        uploadedMediaId: updates?.uploadedMediaId ?? existing.uploadedMediaId,
        uploadStage: updates?.uploadStage ?? existing.uploadStage,
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

  getConversationOutbox: (ownerId: string, conversationId: string) => {
    return Object.values(get().entries).filter(
      (entry) =>
        entry.ownerId === ownerId && entry.conversationId === conversationId,
    );
  },

  getAllOutboxEntries: (ownerId?: string) => {
    const all = Object.values(get().entries);
    if (!ownerId) return all;
    return all.filter((entry) => entry.ownerId === ownerId);
  },

  clearActiveSession: (ownerId?: string) => {
    set((state) => {
      if (!ownerId) {
        return { entries: {} };
      }
      const nextEntries = { ...state.entries };
      Object.keys(nextEntries).forEach((id) => {
        if (nextEntries[id].ownerId === ownerId) {
          delete nextEntries[id];
        }
      });
      persistOutbox(nextEntries);
      return { entries: nextEntries };
    });
  },
}));
