import { useRealtime } from "@/core/providers/RealtimeProvider";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import type {
  MessageCreatedEventPayload,
  PresenceChangedEventPayload,
  TypingStartedEventPayload,
  TypingStoppedEventPayload,
} from "@/types/realtime";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { MessageHistoryResponseDto } from "../types";
import { chatsKeys } from "./useChats";

export function useChatRealtime(
  conversationId: string,
  targetUserId?: string,
) {
  const { socket } = useRealtime();
  const { data: currentUser } = useGetMe();
  const currentUserId = currentUser?.id;
  const queryClient = useQueryClient();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);

  useEffect(() => {
    if (!socket || !conversationId) return;

    // 1. Subscribe to conversation presence
    socket.emit("presence.subscribe", { conversationId }, (ack) => {
      if (ack.ok) {
        if (targetUserId) {
          const other = ack.data.participants.find(
            (p) => p.userId === targetUserId,
          );
          setIsOtherOnline(other?.status === "online");
        } else {
          // If no specific targetUserId, exclude the current user from presence determination
          const other = ack.data.participants.find(
            (p) => (currentUserId ? p.userId !== currentUserId : true),
          );
          if (other && currentUserId && other.userId !== currentUserId) {
            setIsOtherOnline(other.status === "online");
          } else {
            setIsOtherOnline(false);
          }
        }
      } else {
        setIsOtherOnline(false);
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

    // 3. Listen for presence changes
    const handlePresenceChanged = (payload: PresenceChangedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      // Do not react to current user's own presence updates
      if (currentUserId && payload.userId === currentUserId) return;

      if (targetUserId) {
        if (payload.userId === targetUserId) {
          setIsOtherOnline(payload.status === "online");
        }
      } else {
        setIsOtherOnline(payload.status === "online");
      }
    };

    // 4. Listen for typing indicators
    const handleTypingStarted = (payload: TypingStartedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      // Do not react to current user's own typing updates
      if (currentUserId && payload.userId === currentUserId) return;

      if (!targetUserId || payload.userId === targetUserId) {
        setIsOtherTyping(true);
      }
    };

    const handleTypingStopped = (payload: TypingStoppedEventPayload) => {
      if (payload.conversationId !== conversationId) return;
      // Do not react to current user's own typing updates
      if (currentUserId && payload.userId === currentUserId) return;

      if (!targetUserId || payload.userId === targetUserId) {
        setIsOtherTyping(false);
      }
    };

    socket.on("message.created", handleMessageCreated);
    socket.on("presence.changed", handlePresenceChanged);
    socket.on("typing.started", handleTypingStarted);
    socket.on("typing.stopped", handleTypingStopped);

    return () => {
      setIsOtherOnline(false);
      setIsOtherTyping(false);
      socket.emit("presence.unsubscribe", { conversationId }, () => {});
      socket.off("message.created", handleMessageCreated);
      socket.off("presence.changed", handlePresenceChanged);
      socket.off("typing.started", handleTypingStarted);
      socket.off("typing.stopped", handleTypingStopped);
    };
  }, [socket, conversationId, targetUserId, currentUserId, queryClient]);

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

  return {
    isOtherOnline,
    isOtherTyping,
    sendTypingStart,
    sendTypingStop,
  };
}
