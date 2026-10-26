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
  receipts: (id: string) =>
    [...chatsKeys.conversations(), "receipts", id] as const,
};
