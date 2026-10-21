import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "../api";
import { MessageResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

export const useUpdateMessage = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<MessageResponseDto, Error, any>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => chatsApi.updateMessage(conversationId, messageId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useDeleteMessage = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.deleteMessage(conversationId, messageId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useAddReaction = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<any, Error, any>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => chatsApi.addReaction(conversationId, messageId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useRemoveReaction = (
  conversationId: string,
  messageId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.removeReaction(conversationId, messageId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};
