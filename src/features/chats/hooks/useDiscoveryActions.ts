import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { chatsApi } from "../api";
import {
  ContactMatchesResponseDto,
  MatchContactsDto,
  UserSearchResponseDto,
} from "../types";
import { chatsKeys } from "./chatsKeys";

export const useMatchContacts = (
  options?: UseMutationOptions<
    ContactMatchesResponseDto,
    Error,
    MatchContactsDto
  >,
) => {
  return useMutation({
    mutationFn: chatsApi.matchContacts,
    ...options,
  });
};

export const useSearchUsers = (
  params: { q: string; limit?: number; cursor?: string },
  options?: Partial<UseQueryOptions<UserSearchResponseDto, Error>>,
) => {
  return useQuery({
    queryKey: chatsKeys.search(params.q),
    queryFn: () => chatsApi.searchUsers(params),
    enabled: params.q.length >= 3 && (options?.enabled ?? true),
    ...options,
  });
};
