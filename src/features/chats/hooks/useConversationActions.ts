import { profileKeys, useGetMe } from "@/features/settings/hooks/useProfile";
import { ProfileResponseDto } from "@/features/settings/types";
import {
  InfiniteData,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useChatOutboxStore } from "../store";
import { chatsApi } from "../api";
import {
  ClearConversationMessagesResponseDto,
  ConversationResponseDto,
  ConversationSettingsResponseDto,
  CreateDirectConversationDto,
  MessageHistoryResponseDto,
  MessageResponseDto,
  MuteConversationDto,
  SendMessageDto,
  UpdateConversationSettingsDto,
  UpdateReceiptDto,
  DeleteDirectChatResponseDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";
import {
  optimisticallyArchive,
  optimisticallyToggleMute,
  optimisticallyTogglePin,
  optimisticallyUnarchive,
} from "./optimisticHelpers";
import { useOptimisticMutation } from "./useOptimisticMutation";

export const useCreateDirectConversation = (
  options?: UseMutationOptions<
    ConversationResponseDto,
    Error,
    CreateDirectConversationDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: chatsApi.createDirect,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
  });
};

export interface SendMessageContext {
  clientMessageId: string;
}

export type SendMessageVariables = SendMessageDto & {
  localAttachmentUri?: string;
  localAttachmentName?: string;
};

export const useSendMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    SendMessageVariables,
    SendMessageContext
  >,
) => {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  return useMutation<
    MessageResponseDto,
    Error,
    SendMessageVariables,
    SendMessageContext
  >({
    ...options,
    mutationFn: (data: SendMessageVariables) => {
      const payload: SendMessageDto = {
        clientMessageId: data.clientMessageId,
      };
      const trimmedText = data.text?.trim();
      if (trimmedText && trimmedText.length > 0) {
        payload.text = trimmedText;
      }
      if (data.attachmentMediaIds && data.attachmentMediaIds.length > 0) {
        payload.attachmentMediaIds = data.attachmentMediaIds;
      }
      if (data.replyToMessageId) {
        payload.replyToMessageId = data.replyToMessageId;
      }
      return chatsApi.sendMessage(conversationId, payload);
    },
    onMutate: async (newMessageDto, mutation) => {
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];

      await queryClient.cancelQueries({
        queryKey: chatsKeys.messages(conversationId),
      });

      const optimisticMsg: MessageResponseDto = {
        id: `temp_${Date.now()}`,
        conversationId,
        clientMessageId: newMessageDto.clientMessageId,
        senderId: currentUser?.id || "",
        kind: newMessageDto.attachmentMediaIds?.length || newMessageDto.localAttachmentUri ? "image" : "text",
        text: newMessageDto.text || "",
        attachments: newMessageDto.localAttachmentUri
          ? [
              {
                mediaId: `temp_media_${Date.now()}`,
                url: newMessageDto.localAttachmentUri,
                type: "image",
                contentType: "image/jpeg",
                sizeBytes: 0,
              },
            ]
          : undefined,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      queryClient.setQueryData<InfiniteData<MessageHistoryResponseDto>>(
        msgKey,
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [
                {
                  items: [optimisticMsg],
                  pageInfo: { hasNextPage: false, nextCursor: null },
                },
              ],
              pageParams: [undefined],
            };
          }

          // Check if message already exists (e.g. on retry)
          const exists = oldData.pages.some((page) =>
            page.items.some(
              (item) => item.clientMessageId === newMessageDto.clientMessageId,
            ),
          );

          if (exists) {
            const newPages = oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.clientMessageId === newMessageDto.clientMessageId
                  ? { ...item, status: "pending" as const }
                  : item,
              ),
            }));
            return { ...oldData, pages: newPages };
          }

          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            items: [optimisticMsg, ...newPages[0].items],
          };
          return { ...oldData, pages: newPages };
        },
      );

      let consumerContext: any;
      if (options?.onMutate) {
        consumerContext = await options.onMutate(newMessageDto, mutation);
      }

      return { clientMessageId: newMessageDto.clientMessageId, ...consumerContext };
    },
    onSuccess: (realMsg, variables, context, mutation) => {
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];
      queryClient.setQueryData<InfiniteData<MessageHistoryResponseDto>>(
        msgKey,
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          const newPages = oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.clientMessageId === variables.clientMessageId ||
              item.id === realMsg.id
                ? { ...realMsg, status: "sent" as const }
                : item,
            ),
          }));
          return { ...oldData, pages: newPages };
        },
      );
      useChatOutboxStore
        .getState()
        .updateOutboxStatus(variables.clientMessageId, "sent");
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(realMsg, variables, context, mutation);
      }
    },
    onError: (err, variables, context, mutation) => {
      console.error("[useSendMessage] Error sending message:", err);
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];

      // Update ONLY the failed message to status: "failed".
      // Do NOT revert the entire cache snapshot, so unrelated incoming messages remain preserved!
      queryClient.setQueryData<InfiniteData<MessageHistoryResponseDto>>(
        msgKey,
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          const newPages = oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.clientMessageId === variables.clientMessageId
                ? { ...item, status: "failed" as const }
                : item,
            ),
          }));
          return { ...oldData, pages: newPages };
        },
      );

      useChatOutboxStore
        .getState()
        .updateOutboxStatus(variables.clientMessageId, "failed", {
          error: err?.message || "Failed to send message",
        });

      if (options?.onError) {
        options.onError(err, variables, context, mutation);
      }
    },
  });
};

export const useMarkRead = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
  });
};

export const useMarkReceiptDelivered = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) =>
      chatsApi.markReceiptDelivered(conversationId, data),
  });
};

export const useMarkReceiptRead = (conversationId: string) => {
  return useMutation({
    mutationFn: (data: UpdateReceiptDto) =>
      chatsApi.markReceiptRead(conversationId, data),
  });
};

export const useUpdateConversationSettings = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    UpdateConversationSettingsDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      chatsApi.updateConversationSettings(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const usePinConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    void,
    { previousList: unknown }
  >,
) => {
  return useOptimisticMutation<ConversationSettingsResponseDto, void>({
    mutationFn: () => chatsApi.pinConversation(conversationId),
    onMutate: (qc, userId) =>
      optimisticallyTogglePin(qc, userId, conversationId, true),
    errorMessage: "Pin was unsuccessful",
    invalidateKeys: [chatsKeys.detail(conversationId), chatsKeys.list()],
    options,
  });
};

export const useUnpinConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    void,
    { previousList: unknown }
  >,
) => {
  return useOptimisticMutation<ConversationSettingsResponseDto, void>({
    mutationFn: () => chatsApi.unpinConversation(conversationId),
    onMutate: (qc, userId) =>
      optimisticallyTogglePin(qc, userId, conversationId, false),
    errorMessage: "Unpin was unsuccessful",
    invalidateKeys: [chatsKeys.detail(conversationId), chatsKeys.list()],
    options,
  });
};

export const useArchiveConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    void,
    { previousList: unknown; previousArchived: unknown }
  >,
) => {
  return useOptimisticMutation<ConversationSettingsResponseDto, void>({
    mutationFn: () => chatsApi.archiveConversation(conversationId),
    onMutate: (qc, userId) =>
      optimisticallyArchive(qc, userId, conversationId),
    errorMessage: "Archive was unsuccessful",
    invalidateKeys: [
      chatsKeys.detail(conversationId),
      chatsKeys.list(),
      chatsKeys.archived(),
    ],
    options,
  });
};

export const useUnarchiveConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    void,
    { previousList: unknown; previousArchived: unknown }
  >,
) => {
  return useOptimisticMutation<ConversationSettingsResponseDto, void>({
    mutationFn: () => chatsApi.unarchiveConversation(conversationId),
    onMutate: (qc, userId) =>
      optimisticallyUnarchive(qc, userId, conversationId),
    errorMessage: "Unarchive was unsuccessful",
    invalidateKeys: [
      chatsKeys.detail(conversationId),
      chatsKeys.list(),
      chatsKeys.archived(),
    ],
    options,
  });
};

export const useMuteConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    MuteConversationDto,
    { previousList: unknown }
  >,
) => {
  return useOptimisticMutation<
    ConversationSettingsResponseDto,
    MuteConversationDto
  >({
    mutationFn: (data: MuteConversationDto) =>
      chatsApi.muteConversation(conversationId, data),
    onMutate: (qc, userId) =>
      optimisticallyToggleMute(qc, userId, conversationId, true),
    errorMessage: "Muting was unsuccessful",
    invalidateKeys: [chatsKeys.detail(conversationId), chatsKeys.list()],
    options,
  });
};

export const useUnmuteConversation = (
  conversationId: string,
  options?: UseMutationOptions<
    ConversationSettingsResponseDto,
    Error,
    void,
    { previousList: unknown }
  >,
) => {
  return useOptimisticMutation<ConversationSettingsResponseDto, void>({
    mutationFn: () => chatsApi.unmuteConversation(conversationId),
    onMutate: (qc, userId) =>
      optimisticallyToggleMute(qc, userId, conversationId, false),
    errorMessage: "Unmuting was unsuccessful",
    invalidateKeys: [chatsKeys.detail(conversationId), chatsKeys.list()],
    options,
  });
};

export const useFavoriteConversation = (
  conversationId: string,
  options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: () => chatsApi.favoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useUnfavoriteConversation = (
  conversationId: string,
  options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: () => chatsApi.unfavoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useClearMessages = (
  conversationId: string,
  options?: UseMutationOptions<
    ClearConversationMessagesResponseDto,
    Error,
    void
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: () => chatsApi.clearMessages(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useDeleteForMe = (
  conversationId: string,
  options?: UseMutationOptions<
    DeleteDirectChatResponseDto,
    Error,
    void
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: () => chatsApi.deleteForMe(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
  });
};

