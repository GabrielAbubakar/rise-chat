import type { QueryClient } from "@tanstack/react-query";
import { tokenStorage } from "@/services/api/token";
import { MessageResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";
import { findCachedMessage, updateMessageInCache } from "./messageCache";

/**
 * R10: operation-owned optimistic state for single-message actions
 * (edit, delete, react).
 *
 * Each operation records only the fields it changed: their value before
 * (`prev`) and its optimistic value (`next`). On failure it restores a field
 * only while it still OWNS it:
 *
 * - a newer server version is cached (version > the version the operation
 *   started from)            -> the server is authoritative: restore nothing
 * - the field no longer holds this operation's value (another operation or a
 *   server update replaced it) -> leave it
 * - a later operation on the same message is still pending and changed the
 *   same field              -> don't touch the cache; hand our `prev` to that
 *   operation, so if it fails too it restores the real baseline rather than
 *   our failed value
 *
 * This makes overlapping operations correct whichever order they settle in,
 * and never resurrects content a confirmed deletion removed.
 */

type MessageFields = Partial<MessageResponseDto>;

interface PendingMessageOp {
  prev: MessageFields;
  next: MessageFields;
  baseVersion?: number;
}

export interface MessageOpHandle {
  conversationId: string;
  messageId: string;
  key: string;
  op: PendingMessageOp;
}

const pendingOps = new Map<string, PendingMessageOp[]>();
let registryGeneration = tokenStorage.getSessionGeneration();

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const opKey = (conversationId: string, messageId: string) =>
  `${conversationId}:${messageId}`;

/** Ops from an ended session can never settle into this cache; drop them. */
function syncRegistryWithSession() {
  const generation = tokenStorage.getSessionGeneration();
  if (generation !== registryGeneration) {
    pendingOps.clear();
    registryGeneration = generation;
  }
}

/** The message from history, or from the single-message (reply target) cache. */
export function findMessageAnywhere(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): MessageResponseDto | undefined {
  return (
    findCachedMessage(queryClient, conversationId, messageId) ??
    queryClient.getQueryData<MessageResponseDto>(
      chatsKeys.message(conversationId, messageId),
    )
  );
}

/** Applies an optimistic change and registers which fields it owns. */
export function beginMessageOp(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  optimistic: (message: MessageResponseDto) => MessageResponseDto,
): MessageOpHandle | null {
  syncRegistryWithSession();
  const current = findMessageAnywhere(queryClient, conversationId, messageId);
  if (!current) return null;

  const proposed = optimistic(current);
  const prev: MessageFields = {};
  const next: MessageFields = {};
  (Object.keys(proposed) as (keyof MessageResponseDto)[]).forEach((field) => {
    if (!sameValue(current[field], proposed[field])) {
      (prev as any)[field] = current[field];
      (next as any)[field] = proposed[field];
    }
  });

  updateMessageInCache(queryClient, conversationId, messageId, (m) => ({
    ...m,
    ...next,
  }));

  const key = opKey(conversationId, messageId);
  const op: PendingMessageOp = { prev, next, baseVersion: current.version };
  pendingOps.set(key, [...(pendingOps.get(key) ?? []), op]);
  return { conversationId, messageId, key, op };
}

function removeOp(handle: MessageOpHandle): PendingMessageOp[] {
  const ops = pendingOps.get(handle.key) ?? [];
  const index = ops.indexOf(handle.op);
  const later = index === -1 ? [] : ops.slice(index + 1);
  const remaining = ops.filter((o) => o !== handle.op);
  if (remaining.length > 0) pendingOps.set(handle.key, remaining);
  else pendingOps.delete(handle.key);
  return later;
}

/** Success: the server copy (applied version-aware elsewhere) supersedes the op. */
export function settleMessageOp(handle: MessageOpHandle | null | undefined) {
  if (handle) removeOp(handle);
}

/** Failure: undo only what this operation still owns (see module comment). */
export function rollbackMessageOp(
  queryClient: QueryClient,
  handle: MessageOpHandle | null | undefined,
) {
  if (!handle) return;
  const { op } = handle;
  const laterOps = removeOp(handle);

  const restore: MessageFields = {};
  (Object.keys(op.prev) as (keyof MessageResponseDto)[]).forEach((field) => {
    const laterOwner = laterOps.find((o) => field in o.prev);
    if (laterOwner) {
      (laterOwner.prev as any)[field] = op.prev[field];
    } else {
      (restore as any)[field] = op.prev[field];
    }
  });
  if (Object.keys(restore).length === 0) return;

  updateMessageInCache(
    queryClient,
    handle.conversationId,
    handle.messageId,
    (current) => {
      if (
        op.baseVersion !== undefined &&
        current.version !== undefined &&
        current.version > op.baseVersion
      ) {
        return current;
      }
      const patch: MessageFields = {};
      (Object.keys(restore) as (keyof MessageResponseDto)[]).forEach((field) => {
        if (sameValue(current[field], op.next[field])) {
          (patch as any)[field] = restore[field];
        }
      });
      return Object.keys(patch).length > 0 ? { ...current, ...patch } : current;
    },
  );
}
