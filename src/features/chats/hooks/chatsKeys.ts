export const chatsKeys = {
  all: ["chats"] as const,
  discovery: () => [...chatsKeys.all, "discovery"] as const,
  contacts: () => [...chatsKeys.discovery(), "contacts"] as const,
  search: (q: string) => [...chatsKeys.discovery(), "search", q] as const,
  conversations: () => [...chatsKeys.all, "conversations"] as const,
  list: () => [...chatsKeys.conversations(), "list"] as const,
  archived: () => [...chatsKeys.conversations(), "archived"] as const,
  favorites: () => [...chatsKeys.conversations(), "favorites"] as const,
  detail: (id: string) => [...chatsKeys.conversations(), "detail", id] as const,
  messages: (id: string) =>
    [...chatsKeys.conversations(), "messages", id] as const,
  /** A single message (e.g. a reply target). Kept outside `messages(id)` so list cache updates never touch it. */
  message: (conversationId: string, messageId: string) =>
    [...chatsKeys.conversations(), "message", conversationId, messageId] as const,
  receipts: (id: string) =>
    [...chatsKeys.conversations(), "receipts", id] as const,
};
