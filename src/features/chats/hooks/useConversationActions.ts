import { profileKeys, useGetMe } from "@/features/settings/hooks/useProfile";
import { ProfileResponseDto } from "@/features/settings/types";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  ClearConversationMessagesResponseDto,
  ConversationResponseDto,
  ConversationSettingsResponseDto,
  CreateDirectConversationDto,
  MessageResponseDto,
  MuteConversationDto,
  SendMessageDto,
  UpdateConversationSettingsDto,
  UpdateReceiptDto,
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
    mutationFn: chatsApi.createDirect,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
    ...options,
  });
};

export const useSendMessage = (
  conversationId: string,
  options?: UseMutationOptions<
    MessageResponseDto,
    Error,
    SendMessageDto,
    { previousData: unknown }
  >,
) => {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  return useMutation({
    mutationFn: (data: SendMessageDto) =>
      chatsApi.sendMessage(conversationId, data),
    onMutate: async (newMessageDto) => {
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];

      await queryClient.cancelQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      const previousData = queryClient.getQueryData(msgKey);

      const optimisticMsg: MessageResponseDto = {
        id: `temp_${Date.now()}`,
        conversationId,
        clientMessageId: newMessageDto.clientMessageId,
        senderId: currentUser?.id || "",
        kind: "text",
        text: newMessageDto.text,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(msgKey, (oldData: any) => {
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
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [optimisticMsg, ...newPages[0].items],
        };
        return { ...oldData, pages: newPages };
      });

      return { previousData };
    },
    onSuccess: (realMsg, variables, context, mutation) => {
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];
      queryClient.setQueryData(msgKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) =>
            item.clientMessageId === variables.clientMessageId ||
            item.id === realMsg.id
              ? realMsg
              : item,
          ),
        }));
        return { ...oldData, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) {
        options.onSuccess(realMsg, variables, context, mutation);
      }
    },
    onError: (err, variables, context: any, mutation) => {
      if (context?.previousData) {
        const currentUser =
          user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
        queryClient.setQueryData(
          [...chatsKeys.messages(conversationId), currentUser?.id],
          context.previousData,
        );
      }
      if (options?.onError) {
        options.onError(err, variables, context, mutation);
      }
    },
    ...options,
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
    mutationFn: (data) =>
      chatsApi.updateConversationSettings(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
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
    mutationFn: () => chatsApi.favoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUnfavoriteConversation = (
  conversationId: string,
  options?: UseMutationOptions<ConversationSettingsResponseDto, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.unfavoriteConversation(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
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
    mutationFn: () => chatsApi.clearMessages(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.messages(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};
