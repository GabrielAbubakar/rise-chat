import { useSessionMutation } from "@/core/useSessionMutation";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import { UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  MessageReactionEmoji,
  MessageResponseDto,
  UpdateMessageDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";
import {
  applyServerMessage,
  findCachedMessage,
  updateMessageInCache,
} from "./messageCache";

interface MessageMutationContext {
  previous?: MessageResponseDto;
}

/**
 * Shared optimistic flow for single-message mutations: snapshot the cached
 * message, apply `optimistic`, write the server response back on success
 * and restore the snapshot on failure.
 *
 * Runs through `useSessionMutation`, so work started before a logout/login
 * never writes into (or rolls back) the new session's cache.
 */
function useOptimisticMessageMutation<TVars extends { messageId: string }>(
  conversationId: string,
  mutationFn: (vars: TVars) => Promise<MessageResponseDto>,
  optimistic:
    | ((message: MessageResponseDto, vars: TVars) => MessageResponseDto)
    | null,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    TVars,
    MessageMutationContext
  >,
) {
  const queryClient = useQueryClient();

  return useSessionMutation<
    MessageResponseDto,
    Error,
    TVars,
    MessageMutationContext
  >({
    ...options,
    mutationFn,
    onMutate: async (vars, mutation) => {
      await queryClient.cancelQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      const previous = findCachedMessage(
        queryClient,
        conversationId,
        vars.messageId,
      );
      if (optimistic) {
        updateMessageInCache(queryClient, conversationId, vars.messageId, (m) =>
          optimistic(m, vars),
        );
      }
      await options?.onMutate?.(vars, mutation);
      return { previous };
    },
    onSuccess: (serverMessage, vars, context, mutation) => {
      applyServerMessage(queryClient, serverMessage);
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      options?.onSuccess?.(serverMessage, vars, context, mutation);
    },
    onError: (error, vars, context, mutation) => {
      const previous = context?.previous;
      if (previous) {
        updateMessageInCache(
          queryClient,
          conversationId,
          vars.messageId,
          () => previous,
        );
      }
      options?.onError?.(error, vars, context, mutation);
    },
  });
}

export interface EditMessageVariables extends UpdateMessageDto {
  messageId: string;
}

export const useUpdateMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    EditMessageVariables,
    MessageMutationContext
  >,
) =>
  useOptimisticMessageMutation<EditMessageVariables>(
    conversationId,
    ({ messageId, ...data }) =>
      chatsApi.updateMessage(conversationId, messageId, data),
    (message, { text }) => ({
      ...message,
      text,
      editedAt: new Date().toISOString(),
    }),
    options,
  );

export interface DeleteMessageVariables {
  messageId: string;
}

/** Deletes your own message for everyone, leaving a placeholder. */
export const useDeleteMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    DeleteMessageVariables,
    MessageMutationContext
  >,
) =>
  useOptimisticMessageMutation<DeleteMessageVariables>(
    conversationId,
    ({ messageId }) => chatsApi.deleteMessage(conversationId, messageId),
    (message) => ({
      ...message,
      deletedAt: new Date().toISOString(),
      text: null,
      attachments: [],
      reactions: [],
    }),
    options,
  );

export interface ReactToMessageVariables {
  messageId: string;
  /** The emoji to set, or null to remove your reaction. */
  emoji: MessageReactionEmoji | null;
}

/** Sets, replaces, or (with `emoji: null`) removes your one reaction on a message. */
export const useReactToMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    ReactToMessageVariables,
    MessageMutationContext
  >,
) => {
  const { data: user } = useGetMe();
  const userId = user?.id;

  return useOptimisticMessageMutation<ReactToMessageVariables>(
    conversationId,
    ({ messageId, emoji }) =>
      emoji
        ? chatsApi.addReaction(conversationId, messageId, { emoji })
        : chatsApi.removeReaction(conversationId, messageId),
    userId
      ? (message, { emoji }) => {
          const others = (message.reactions ?? []).filter(
            (r) => r.userId !== userId,
          );
          return {
            ...message,
            reactions: emoji ? [...others, { userId, emoji }] : others,
          };
        }
      : null,
    options,
  );
};
