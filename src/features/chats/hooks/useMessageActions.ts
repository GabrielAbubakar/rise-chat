import { useSessionMutation } from "@/core/useSessionMutation";
import {
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  AddReactionDto,
  MessageResponseDto,
  UpdateMessageDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";

export const useUpdateMessage = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<MessageResponseDto, Error, UpdateMessageDto>,
) => {
  const queryClient = useQueryClient();
  return useSessionMutation({
    ...options,
    mutationFn: (data: UpdateMessageDto) =>
      chatsApi.updateMessage(conversationId, messageId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useDeleteMessage = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useSessionMutation({
    ...options,
    mutationFn: () => chatsApi.deleteMessage(conversationId, messageId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useAddReaction = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<MessageResponseDto, Error, AddReactionDto>,
) => {
  const queryClient = useQueryClient();
  return useSessionMutation({
    ...options,
    mutationFn: (data: AddReactionDto) =>
      chatsApi.addReaction(conversationId, messageId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useRemoveReaction = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useSessionMutation({
    ...options,
    mutationFn: () => chatsApi.removeReaction(conversationId, messageId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};
