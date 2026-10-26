import { useState, useCallback } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { uploadMedia } from "@/features/media/services";
import { generateUUID, showApiErrorToast } from "@/shared/utils";
import { SelectedAttachment } from "../components";
import { useChatDraftsStore } from "../store/useChatDraftsStore";
import { useChatOutboxStore, OutboxEntry } from "../store/useChatOutboxStore";
import { MessageHistoryResponseDto, MessageResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";
import { profileKeys, useGetMe } from "@/features/settings/hooks/useProfile";
import { ProfileResponseDto } from "@/features/settings/types";

export interface UseSendChatMessageOptions {
  conversationId: string;
  sendMessageMutation: {
    mutate: (vars: any) => void;
    isPending: boolean;
  };
  sendTypingStop: () => void;
  onMessageSent?: () => void;
}

export function useSendChatMessage({
  conversationId,
  sendMessageMutation,
  sendTypingStop,
  onMessageSent,
}: UseSendChatMessageOptions) {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const getDraft = useChatDraftsStore((state) => state.getDraft);
  const setDraft = useChatDraftsStore((state) => state.setDraft);
  const clearDraft = useChatDraftsStore((state) => state.clearDraft);

  const addOutboxEntry = useChatOutboxStore((state) => state.addOutboxEntry);
  const updateOutboxStatus = useChatOutboxStore(
    (state) => state.updateOutboxStatus,
  );
  const getOutboxEntry = useChatOutboxStore((state) => state.getOutboxEntry);

  // Restore persistent draft on mount / conversationId change
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  const [message, setMessageState] = useState(
    () => (conversationId ? getDraft(conversationId)?.text || "" : ""),
  );
  const [selectedAttachment, setSelectedAttachmentState] =
    useState<SelectedAttachment | null>(() =>
      conversationId ? getDraft(conversationId)?.attachment || null : null,
    );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Synchronize when switching conversations during render instead of effect
  if (prevConversationId !== conversationId) {
    setPrevConversationId(conversationId);
    const draft = conversationId ? getDraft(conversationId) : undefined;
    setMessageState(draft?.text || "");
    setSelectedAttachmentState(draft?.attachment || null);
  }

  const setMessage = useCallback(
    (newText: string) => {
      setMessageState(newText);
      if (conversationId) {
        setDraft(conversationId, newText, selectedAttachment);
      }
    },
    [conversationId, selectedAttachment, setDraft],
  );

  const setSelectedAttachment = useCallback(
    (attachment: SelectedAttachment | null) => {
      setSelectedAttachmentState(attachment);
      if (conversationId) {
        setDraft(conversationId, message, attachment);
      }
    },
    [conversationId, message, setDraft],
  );

  const setOptimisticMessageStatus = useCallback(
    (clientMessageId: string, status: "pending" | "failed" | "sent") => {
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
              item.clientMessageId === clientMessageId
                ? { ...item, status }
                : item,
            ),
          }));
          return { ...oldData, pages: newPages };
        },
      );
    },
    [conversationId, queryClient, user],
  );

  const insertOptimisticPendingMessage = useCallback(
    (
      clientMessageId: string,
      textToSend?: string,
      attachment?: SelectedAttachment | null,
    ) => {
      const currentUser =
        user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
      const msgKey = [...chatsKeys.messages(conversationId), currentUser?.id];

      const optimisticMsg: MessageResponseDto = {
        id: `temp_${Date.now()}`,
        conversationId,
        clientMessageId,
        senderId: currentUser?.id || "",
        kind: attachment ? "image" : "text",
        text: textToSend || "",
        attachments: attachment
          ? [
              {
                mediaId: `temp_media_${Date.now()}`,
                url: attachment.uri,
                type: "image",
                contentType: attachment.mimeType || "image/jpeg",
                sizeBytes: attachment.fileSize || 0,
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

          const exists = oldData.pages.some((page) =>
            page.items.some((item) => item.clientMessageId === clientMessageId),
          );

          if (exists) {
            const newPages = oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.clientMessageId === clientMessageId
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
    },
    [conversationId, queryClient, user],
  );

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && !selectedAttachment) || !conversationId) return;

    const textToSend = message.trim();
    const currentAttachment = selectedAttachment;
    const clientMessageId = generateUUID();

    // 1. Move draft into durable outbox entry
    const outboxEntry: OutboxEntry = {
      clientMessageId,
      conversationId,
      text: textToSend || undefined,
      attachment: currentAttachment,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    addOutboxEntry(outboxEntry);

    // 2. Clear input state and draft storage
    setMessageState("");
    setSelectedAttachmentState(null);
    clearDraft(conversationId);
    sendTypingStop();

    // 3. Immediately display message in chat history as pending
    insertOptimisticPendingMessage(
      clientMessageId,
      textToSend,
      currentAttachment,
    );

    if (onMessageSent) {
      onMessageSent();
    }

    let uploadedMediaId: string | undefined = undefined;

    // 4. Upload attachment if attached
    if (currentAttachment) {
      try {
        setIsUploadingAttachment(true);
        const mediaAsset = await uploadMedia({
          uri: currentAttachment.uri,
          purpose: "message_attachment",
          fileName: currentAttachment.fileName || undefined,
          mimeType: currentAttachment.mimeType || undefined,
          sizeBytes: currentAttachment.fileSize || undefined,
        });
        uploadedMediaId = mediaAsset.id;
        updateOutboxStatus(clientMessageId, "pending", {
          uploadedMediaId: mediaAsset.id,
        });
      } catch (error: any) {
        showApiErrorToast(error, "Failed to upload attachment");
        updateOutboxStatus(clientMessageId, "failed", {
          error: error?.message || "Upload failed",
        });
        setOptimisticMessageStatus(clientMessageId, "failed");
        setIsUploadingAttachment(false);
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    // 5. Submit message with clientMessageId
    sendMessageMutation.mutate({
      clientMessageId,
      text: textToSend || undefined,
      attachmentMediaIds: uploadedMediaId ? [uploadedMediaId] : undefined,
      localAttachmentUri: currentAttachment?.uri,
    });
  }, [
    message,
    selectedAttachment,
    conversationId,
    addOutboxEntry,
    clearDraft,
    sendTypingStop,
    insertOptimisticPendingMessage,
    onMessageSent,
    sendMessageMutation,
    updateOutboxStatus,
    setOptimisticMessageStatus,
  ]);

  const handleRetryMessage = useCallback(
    async (clientMessageId: string) => {
      if (!conversationId || !clientMessageId) return;

      const entry = getOutboxEntry(clientMessageId);
      const textToSend = entry?.text;
      const attachment = entry?.attachment;
      let uploadedMediaId = entry?.uploadedMediaId;

      // Set state to pending
      updateOutboxStatus(clientMessageId, "pending");
      setOptimisticMessageStatus(clientMessageId, "pending");

      // Upload if media was not yet uploaded
      if (attachment && !uploadedMediaId) {
        try {
          setIsUploadingAttachment(true);
          const mediaAsset = await uploadMedia({
            uri: attachment.uri,
            purpose: "message_attachment",
            fileName: attachment.fileName || undefined,
            mimeType: attachment.mimeType || undefined,
            sizeBytes: attachment.fileSize || undefined,
          });
          uploadedMediaId = mediaAsset.id;
          updateOutboxStatus(clientMessageId, "pending", {
            uploadedMediaId: mediaAsset.id,
          });
        } catch (error: any) {
          showApiErrorToast(error, "Failed to upload attachment on retry");
          updateOutboxStatus(clientMessageId, "failed", {
            error: error?.message || "Upload failed",
          });
          setOptimisticMessageStatus(clientMessageId, "failed");
          setIsUploadingAttachment(false);
          return;
        } finally {
          setIsUploadingAttachment(false);
        }
      }

      // Retry sending using the EXACT SAME clientMessageId
      sendMessageMutation.mutate({
        clientMessageId,
        text: textToSend || undefined,
        attachmentMediaIds: uploadedMediaId ? [uploadedMediaId] : undefined,
        localAttachmentUri: attachment?.uri,
      });
    },
    [
      conversationId,
      getOutboxEntry,
      updateOutboxStatus,
      setOptimisticMessageStatus,
      sendMessageMutation,
    ],
  );

  return {
    message,
    setMessage,
    selectedAttachment,
    setSelectedAttachment,
    isUploadingAttachment,
    handleSendMessage,
    handleRetryMessage,
  };
}
