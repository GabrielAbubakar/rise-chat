import {
  assertSetupInSession,
  cancelQueriesInSession,
} from "@/core/sessionQueries";
import { useSessionMutation } from "@/core/useSessionMutation";
import { tokenStorage } from "@/services/api/token";
import { useGetMe } from "@/features/settings/hooks/useProfile";
import { UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  MessageReactionEmoji,
  MessageResponseDto,
  UpdateMessageDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";
import { applyServerMessage } from "./messageCache";
import {
  beginMessageOp,
  findMessageAnywhere,
  MessageOpHandle,
  rollbackMessageOp,
  settleMessageOp,
} from "./messageOptimisticOps";

export interface MessageMutationContext {
  /** The message as cached when the action started (for consumers). */
  previous?: MessageResponseDto;
  /** Ownership record for this action's optimistic fields. */
  op?: MessageOpHandle | null;
}

/**
 * Shared optimistic flow for single-message mutations (edit, delete, react):
 * apply `optimistic`, write the server response back version-aware on
 * success, and on failure undo only the fields this operation still owns
 * (R10, see messageOptimisticOps) instead of restoring a whole snapshot that
 * may be older than a confirmed edit or deletion.
 *
 * Runs through `useSessionMutation`, and rechecks the session right after each
 * await in its setup (R4), so work started before a logout/login never writes
 * into (or rolls back) the new session's cache.
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
      const generation = tokenStorage.getSessionGeneration();
      await cancelQueriesInSession(
        queryClient,
        { queryKey: chatsKeys.messages(conversationId) },
        { generation },
      );
      const previous = findMessageAnywhere(
        queryClient,
        conversationId,
        vars.messageId,
      );
      const op = optimistic
        ? beginMessageOp(queryClient, conversationId, vars.messageId, (m) =>
            optimistic(m, vars),
          )
        : null;
      await options?.onMutate?.(vars, mutation);
      assertSetupInSession(generation);
      return { previous, op };
    },
    onSuccess: (serverMessage, vars, context, mutation) => {
      settleMessageOp(context?.op);
      applyServerMessage(queryClient, serverMessage);
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      options?.onSuccess?.(serverMessage, vars, context, mutation);
    },
    onError: (error, vars, context, mutation) => {
      rollbackMessageOp(queryClient, context?.op);
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
