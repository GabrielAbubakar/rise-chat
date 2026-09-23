import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  AddGroupMembersDto,
  CreateGroupConversationDto,
  GroupConversationResponseDto,
  TransferGroupOwnershipDto,
  UpdateGroupConversationDto,
  UpdateGroupMemberRoleDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";

export const useCreateGroup = (
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    CreateGroupConversationDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatsApi.createGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUpdateGroup = (
  conversationId: string,
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    UpdateGroupConversationDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.updateGroup(conversationId, data),
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

export const useSetGroupAvatar = (
  conversationId: string,
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    { mediaId: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.setGroupAvatar(conversationId, data),
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

export const useDeleteGroup = (
  conversationId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.deleteGroup(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useAddGroupMembers = (
  conversationId: string,
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    AddGroupMembersDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => chatsApi.addGroupMembers(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useRemoveGroupMember = (
  conversationId: string,
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId) =>
      chatsApi.removeGroupMember(conversationId, memberId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useUpdateGroupMemberRole = (
  conversationId: string,
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    { memberId: string; data: UpdateGroupMemberRoleDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }) =>
      chatsApi.updateGroupMemberRole(conversationId, memberId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useTransferGroupOwnership = (
  conversationId: string,
  options?: UseMutationOptions<
    GroupConversationResponseDto,
    Error,
    TransferGroupOwnershipDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      chatsApi.transferGroupOwnership(conversationId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: chatsKeys.detail(conversationId),
      });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};

export const useLeaveGroup = (
  conversationId: string,
  options?: UseMutationOptions<void, Error, void>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatsApi.leaveGroup(conversationId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
      if (options?.onSuccess) options.onSuccess(...args);
    },
    ...options,
  });
};
