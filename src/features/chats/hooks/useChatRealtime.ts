import { useRealtime } from "@/core/providers/RealtimeProvider";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import type {
  MessageCreatedEventPayload,
  PresenceChangedEventPayload,
  TypingStartedEventPayload,
  TypingStoppedEventPayload,
  ReceiptUpdatedEventPayload,
} from "@/types/realtime";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type {
  MessageHistoryResponseDto,
  ReceiptFrontierResponseDto,
  ReceiptFrontiersResponseDto,
} from "../types";
import { chatsKeys } from "./useChats";

export function useChatRealtime(
  conversationId: string,
  targetUserId?: string,
) {
  const { socket, reconcileVersion } = useRealtime();
  const { data: currentUser } = useGetMe();
  const currentUserId = currentUser?.id;
  const queryClient = useQueryClient();

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Invalidate conversation messages on reconnection to catch any missed messages
    if (reconcileVersion > 0) {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
    }

    // 1. Subscribe to conversation presence
    socket.emit("presence.subscribe", { conversationId }, (ack) => {
      if (ack.ok && ack.data?.participants) {
        const nextOnline = new Set<string>();
        for (const p of ack.data.participants) {
          if (
            p.userId &&
            (!currentUserId || p.userId !== currentUserId) &&
            p.status === "online"
          ) {
            nextOnline.add(p.userId);
          }
        }
        setOnlineUserIds(nextOnline);
      } else {
        setOnlineUserIds(new Set());
      }
    });

    // 2. Listen for real-time incoming messages
    const handleMessageCreated = (payload: MessageCreatedEventPayload) => {
      if (payload.conversationId === conversationId) {
        queryClient.setQueriesData<InfiniteData<MessageHistoryResponseDto>>(
          { queryKey: chatsKeys.messages(conversationId) },
          (oldData) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) {
              return {
                pages: [
                  {
                    items: [payload],
                    pageInfo: { hasNextPage: false, nextCursor: null },
                  },
                ],
                pageParams: [undefined],
              };
            }
            const exists = oldData.pages.some((page) =>
              page.items.some(
                (msg) =>
                  msg.id === payload.id ||
                  (msg.clientMessageId &&
                    payload.clientMessageId &&
                    msg.clientMessageId === payload.clientMessageId),
              ),
            );
            if (exists) {
              const newPages = oldData.pages.map((page) => ({
                ...page,
                items: page.items.map((msg) =>
                  msg.id === payload.id ||
                  (msg.clientMessageId &&
                    payload.clientMessageId &&
                    msg.clientMessageId === payload.clientMessageId)
                    ? payload
                    : msg,
                ),
              }));
              return { ...oldData, pages: newPages };
            }

            const newPages = [...oldData.pages];
            newPages[0] = {
              ...newPages[0],
              items: [payload, ...newPages[0].items],
            };
            return { ...oldData, pages: newPages };
          },
        );
        queryClient.invalidateQueries({
          queryKey: chatsKeys.list(),
        });
      }
    };

    // 3. Listen for presence changes (tracked per userId, excluding self)
    const handlePresenceChanged = (payload: PresenceChangedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (currentUserId && payload.userId === currentUserId) return;

      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (payload.status === "online") {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    // 4. Listen for typing indicators with auto-expiry
    const handleTypingStarted = (payload: TypingStartedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (currentUserId && payload.userId === currentUserId) return;
      if (targetUserId && payload.userId !== targetUserId) return;

      // Clear any prior expiry timer for this user
      const existing = typingTimeoutsRef.current.get(payload.userId);
      if (existing) {
        clearTimeout(existing);
      }

      // Automatically expire typing indicator after 5 seconds if no stop received
      const timer = setTimeout(() => {
        setTypingUserIds((prev) => {
          if (!prev.has(payload.userId)) return prev;
          const next = new Set(prev);
          next.delete(payload.userId);
          return next;
        });
        typingTimeoutsRef.current.delete(payload.userId);
      }, 5000);

      typingTimeoutsRef.current.set(payload.userId, timer);

      setTypingUserIds((prev) => {
        if (prev.has(payload.userId)) return prev;
        const next = new Set(prev);
        next.add(payload.userId);
        return next;
      });
    };

    const handleTypingStopped = (payload: TypingStoppedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (currentUserId && payload.userId === currentUserId) return;

      const existing = typingTimeoutsRef.current.get(payload.userId);
      if (existing) {
        clearTimeout(existing);
        typingTimeoutsRef.current.delete(payload.userId);
      }

      setTypingUserIds((prev) => {
        if (!prev.has(payload.userId)) return prev;
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    };

    // 5. Listen for delivery & read receipt updates
    const handleReceiptUpdated = (payload: ReceiptUpdatedEventPayload) => {
      if (payload.conversationId !== conversationId) return;

      queryClient.setQueryData<ReceiptFrontiersResponseDto>(
        [...chatsKeys.receipts(conversationId), currentUserId],
        (oldData) => {
          const existingItems = oldData?.items || [];
          const userIndex = existingItems.findIndex(
            (f) => f.userId === payload.userId,
          );

          const updatedFrontier: ReceiptFrontierResponseDto = {
            userId: payload.userId,
            version: payload.version,
            delivered: payload.delivered,
            read: payload.read,
          };

          if (userIndex === -1) {
            return {
              conversationId,
              items: [...existingItems, updatedFrontier],
            };
          }

          // Enforce monotonic receipt versioning
          const existing = existingItems[userIndex];
          if (existing.version > payload.version) {
            return oldData;
          }

          const nextItems = [...existingItems];
          nextItems[userIndex] = updatedFrontier;
          return { conversationId, items: nextItems };
        },
      );
    };

    socket.on("message.created", handleMessageCreated);
    socket.on("presence.changed", handlePresenceChanged);
    socket.on("typing.started", handleTypingStarted);
    socket.on("typing.stopped", handleTypingStopped);
    socket.on("receipt.delivered", handleReceiptUpdated);
    socket.on("receipt.read", handleReceiptUpdated);

    return () => {
      // Clear all active typing timers and reset transient state on unmount/conversation switch
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      setTypingUserIds(new Set());
      setOnlineUserIds(new Set());

      socket.emit("presence.unsubscribe", { conversationId }, () => {});
      socket.off("message.created", handleMessageCreated);
      socket.off("presence.changed", handlePresenceChanged);
      socket.off("typing.started", handleTypingStarted);
      socket.off("typing.stopped", handleTypingStopped);
      socket.off("receipt.delivered", handleReceiptUpdated);
      socket.off("receipt.read", handleReceiptUpdated);
    };
  }, [
    socket,
    conversationId,
    targetUserId,
    currentUserId,
    queryClient,
    reconcileVersion,
  ]);

  const sendTypingStart = () => {
    if (socket && conversationId) {
      socket.emit("typing.start", { conversationId }, () => {});
    }
  };

  const sendTypingStop = () => {
    if (socket && conversationId) {
      socket.emit("typing.stop", { conversationId }, () => {});
    }
  };

  const isOtherOnline = targetUserId
    ? onlineUserIds.has(targetUserId)
    : onlineUserIds.size > 0;

  const isOtherTyping = targetUserId
    ? typingUserIds.has(targetUserId)
    : typingUserIds.size > 0;

  return {
    isOtherOnline,
    isOtherTyping,
    onlineUserIds,
    typingUserIds,
    sendTypingStart,
    sendTypingStop,
  };
}

