import { useEffect, useMemo } from "react";
import { OutboxEntry, useChatOutboxStore } from "../store/useChatOutboxStore";
import { MessageResponseDto } from "../types";

/** Local (not yet server-confirmed) bubbles use this id prefix, like optimistic ones. */
export const OUTBOX_MESSAGE_ID_PREFIX = "temp_outbox_";

/** A message is server-confirmed once it has a real (non-temporary) id. */
export const isConfirmedMessage = (message: MessageResponseDto) =>
  !message.id.startsWith("temp_");

function isImageAttachment(entry: OutboxEntry) {
  const attachment = entry.attachment;
  if (!attachment) return false;
  return (
    attachment.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(attachment.uri)
  );
}

/** Builds the bubble for an outbox entry that history doesn't (yet) contain. */
export function buildOutboxMessage(
  entry: OutboxEntry,
  senderId: string,
): MessageResponseDto {
  const isImage = isImageAttachment(entry);
  return {
    id: `${OUTBOX_MESSAGE_ID_PREFIX}${entry.clientMessageId}`,
    conversationId: entry.conversationId,
    clientMessageId: entry.clientMessageId,
    senderId,
    kind: entry.attachment ? (isImage ? "image" : "document") : "text",
    text: entry.text || "",
    attachments: entry.attachment
      ? [
          {
            mediaId: entry.uploadedMediaId ?? `temp_media_${entry.clientMessageId}`,
            url: entry.attachment.uri,
            type: isImage ? "image" : "document",
            contentType:
              entry.attachment.mimeType ||
              (isImage ? "image/jpeg" : "application/pdf"),
            sizeBytes: entry.attachment.fileSize || 0,
            originalFilename: entry.attachment.fileName || null,
          },
        ]
      : undefined,
    createdAt: entry.createdAt,
    status: entry.status === "failed" ? "failed" : "pending",
  } as MessageResponseDto;
}

/**
 * R7: merges the current owner's unsent outbox entries into remote history.
 *
 * Works whether or not history loaded (offline cold start = history undefined):
 * - history has a confirmed message with the same clientMessageId -> history wins
 *   (no duplicate bubble; the entry is reported in `confirmedIds` to reconcile)
 * - history has only an optimistic/temp copy -> its status follows the outbox
 *   (a persisted temp bubble from a killed process would otherwise spin forever)
 * - history lacks it -> a local bubble is built from the entry
 */
export function mergeOutboxIntoHistory(
  history: MessageResponseDto[] | undefined,
  entries: OutboxEntry[],
  ownerId: string | undefined,
  conversationId: string,
): { messages: MessageResponseDto[]; confirmedIds: string[] } {
  const base = history ?? [];
  if (!ownerId) return { messages: base, confirmedIds: [] };

  const unsent = entries.filter(
    (e) =>
      e.ownerId === ownerId &&
      e.conversationId === conversationId &&
      e.status !== "sent",
  );
  if (unsent.length === 0) return { messages: base, confirmedIds: [] };

  const byClientId = new Map<string, MessageResponseDto>();
  base.forEach((m) => {
    if (m.clientMessageId) byClientId.set(m.clientMessageId, m);
  });

  const confirmedIds: string[] = [];
  const statusOverrides = new Map<string, MessageResponseDto["status"]>();
  const additions: MessageResponseDto[] = [];

  unsent.forEach((entry) => {
    const existing = byClientId.get(entry.clientMessageId);
    if (existing && isConfirmedMessage(existing)) {
      confirmedIds.push(entry.clientMessageId);
    } else if (existing) {
      statusOverrides.set(
        entry.clientMessageId,
        entry.status === "failed" ? "failed" : "pending",
      );
    } else {
      additions.push(buildOutboxMessage(entry, ownerId));
    }
  });

  const messages = base.map((m) =>
    m.clientMessageId && statusOverrides.has(m.clientMessageId)
      ? { ...m, status: statusOverrides.get(m.clientMessageId) }
      : m,
  );
  return { messages: [...messages, ...additions], confirmedIds };
}

/**
 * Room-level view of history + this owner's outbox, independent of whether the
 * remote history request succeeded. Marks entries sent once history shows the
 * server-confirmed message (e.g. confirmed by socket before the HTTP response).
 */
export function useOutboxMessages(
  history: MessageResponseDto[] | undefined,
  ownerId: string | undefined,
  conversationId: string,
): MessageResponseDto[] {
  const entries = useChatOutboxStore((state) => state.entries);
  const updateOutboxStatus = useChatOutboxStore(
    (state) => state.updateOutboxStatus,
  );

  const { messages, confirmedIds } = useMemo(
    () =>
      mergeOutboxIntoHistory(
        history,
        Object.values(entries),
        ownerId,
        conversationId,
      ),
    [history, entries, ownerId, conversationId],
  );

  useEffect(() => {
    confirmedIds.forEach((id) => updateOutboxStatus(id, "sent"));
  }, [confirmedIds, updateOutboxStatus]);

  return messages;
}
