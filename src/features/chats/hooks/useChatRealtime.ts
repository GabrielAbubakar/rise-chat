import type {
  MessageCreatedEventPayload,
  PresenceChangedEventPayload,
  TypingStartedEventPayload,
  TypingStoppedEventPayload,
} from "@/core/api/protocol";
import { useRealtime } from "@/core/providers/RealtimeProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { chatsKeys } from "./useChats";

export function useChatRealtime(conversationId: string) {
  const { socket } = useRealtime();
  const queryClient = useQueryClient();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);

  useEffect(() => {
    if (!socket || !conversationId) return;

    // 1. Subscribe to conversation presence
    socket.emit("presence.subscribe", { conversationId }, (ack) => {
      if (ack.ok) {
        const other = ack.data.participants.find((p) => p.userId !== undefined);
        if (other) {
          setIsOtherOnline(other.status === "online");
        }
      }
    });

    // 2. Listen for real-time incoming messages
    const handleMessageCreated = (payload: MessageCreatedEventPayload) => {
      if (payload.conversationId === conversationId) {
        queryClient.setQueriesData(
          { queryKey: chatsKeys.messages(conversationId) },
          (oldData: any) => {
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
            const exists = oldData.pages.some((page: any) =>
              page.items.some(
                (msg: any) =>
                  msg.id === payload.id ||
                  (msg.clientMessageId &&
                    payload.clientMessageId &&
                    msg.clientMessageId === payload.clientMessageId),
              ),
            );
            if (exists) {
              const newPages = oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.map((msg: any) =>
                  msg.clientMessageId &&
                  payload.clientMessageId &&
                  msg.clientMessageId === payload.clientMessageId
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
      if (payload.conversationId === conversationId) {
        setIsOtherOnline(payload.status === "online");
      }
    };

    // 4. Listen for typing indicators
    const handleTypingStarted = (payload: TypingStartedEventPayload) => {
      if (payload.conversationId === conversationId) {
        setIsOtherTyping(true);
      }
    };

    const handleTypingStopped = (payload: TypingStoppedEventPayload) => {
      if (payload.conversationId === conversationId) {
        setIsOtherTyping(false);
      }
    };

    socket.on("message.created", handleMessageCreated);
    socket.on("presence.changed", handlePresenceChanged);
    socket.on("typing.started", handleTypingStarted);
    socket.on("typing.stopped", handleTypingStopped);

    return () => {
      socket.emit("presence.unsubscribe", { conversationId }, () => {});
      socket.off("message.created", handleMessageCreated);
      socket.off("presence.changed", handlePresenceChanged);
      socket.off("typing.started", handleTypingStarted);
      socket.off("typing.stopped", handleTypingStopped);
    };
  }, [socket, conversationId, queryClient]);

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
