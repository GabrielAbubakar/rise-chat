import {
  isStaleSessionError,
  runInSession,
} from "@/services/session/staleSession";
import {
  DefaultError,
  MutateOptions,
  QueryClient,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Drop-in replacement for `useMutation` for account-owned mutations.
 *
 * Each execution is bound to the session that started it:
 * - `onMutate` and `mutationFn` run via `runInSession`, so if logout/login
 *   happens while either is pending, the execution settles with a
 *   StaleSessionError instead of its real outcome.
 * - Because the outcome becomes an error, `onSuccess` never runs for stale
 *   work; `onError`/`onSettled` (hook-level and per-call) are skipped when the
 *   error is a StaleSessionError, so no rollback or toast touches the new session.
 * - `mutateAsync` rejects with StaleSessionError; `showApiErrorToast` ignores it.
 */
export function useSessionMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const { mutationFn, onMutate, onError, onSettled } = options;

  const result = useMutation<TData, TError, TVariables, TOnMutateResult>(
    {
      ...options,
      mutationFn: mutationFn
        ? (variables, context) =>
            runInSession(() => mutationFn(variables, context))
        : undefined,
      onMutate: onMutate
        ? (variables, context) =>
            runInSession(() => onMutate(variables, context))
        : undefined,
      onError: onError
        ? (error, ...rest) =>
            isStaleSessionError(error) ? undefined : onError(error, ...rest)
        : undefined,
      onSettled: onSettled
        ? (data, error, ...rest) =>
            isStaleSessionError(error)
              ? undefined
              : onSettled(data, error, ...rest)
        : undefined,
    },
    queryClient,
  );

  const { mutate, mutateAsync } = result;

  const guardedMutate = useCallback(
    (
      variables: TVariables,
      mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
    ) => mutate(variables, guardMutateOptions(mutateOptions)),
    [mutate],
  );

  const guardedMutateAsync = useCallback(
    (
      variables: TVariables,
      mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
    ) => mutateAsync(variables, guardMutateOptions(mutateOptions)),
    [mutateAsync],
  );

  return {
    ...result,
    mutate: guardedMutate,
    mutateAsync: guardedMutateAsync,
  } as UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
}

function guardMutateOptions<TData, TError, TVariables, TOnMutateResult>(
  mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
): MutateOptions<TData, TError, TVariables, TOnMutateResult> | undefined {
  if (!mutateOptions) return mutateOptions;
  const { onError, onSettled } = mutateOptions;
  return {
    ...mutateOptions,
    onError: onError
      ? (error, ...rest) =>
          isStaleSessionError(error) ? undefined : onError(error, ...rest)
      : undefined,
    onSettled: onSettled
      ? (data, error, ...rest) =>
          isStaleSessionError(error) ? undefined : onSettled(data, error, ...rest)
      : undefined,
  };
}
