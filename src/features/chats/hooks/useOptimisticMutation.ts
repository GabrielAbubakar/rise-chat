import { showInfoToast } from "@/shared/utils";
import { useAuthStore } from "@/store/useAuthStore";
import {
  QueryClient,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { chatsKeys } from "./chatsKeys";

export interface UseOptimisticMutationConfig<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate: (
    queryClient: QueryClient,
    userId: string | undefined,
    variables: TVariables,
  ) => Promise<TContext>;
  errorMessage: string;
  invalidateKeys?: readonly (readonly unknown[])[];
  options?: UseMutationOptions<TData, Error, TVariables, TContext>;
}

export function useOptimisticMutation<
  TData = any,
  TVariables = void,
  TContext = any,
>({
  mutationFn,
  onMutate,
  errorMessage,
  invalidateKeys = [chatsKeys.list()],
  options,
}: UseOptimisticMutationConfig<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    onMutate: (variables) => onMutate(queryClient, user?.id, variables),
    onError: (err, variables, context, mutation) => {
      if (context && (context as any).previousList) {
        queryClient.setQueryData(
          [...chatsKeys.list(), user?.id],
          (context as any).previousList,
        );
      }
      if (context && (context as any).previousArchived) {
        queryClient.setQueryData(
          [...chatsKeys.archived(), user?.id],
          (context as any).previousArchived,
        );
      }
      showInfoToast(errorMessage, "Action Failed");
      if (options?.onError) {
        options.onError(err, variables, context, mutation);
      }
    },
    onSettled: (data, error, variables, context, mutation) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (options?.onSettled) {
        options.onSettled(data, error, variables, context, mutation);
      }
    },
    ...options,
  });
}
