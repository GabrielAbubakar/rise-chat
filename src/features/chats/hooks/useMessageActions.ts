import {
  useMutation,
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
  return useMutation({
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
  return useMutation({
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
  return useMutation({
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
  return useMutation({
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
