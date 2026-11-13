import { uploadMedia } from "@/features/media/services";
import { profileKeys, useGetMe } from "@/features/settings/hooks/useProfile";
import { ProfileResponseDto } from "@/features/settings/types";
import { tokenStorage } from "@/services/api/token";
import { generateUUID, showApiErrorToast, showInfoToast } from "@/shared/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { SelectedAttachment } from "../components";
import { useChatDraftsStore } from "../store/useChatDraftsStore";
import { OutboxEntry, useChatOutboxStore } from "../store/useChatOutboxStore";
import { MessageHistoryResponseDto, MessageResponseDto } from "../types";
import { chatsKeys } from "./chatsKeys";

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

  const currentUser =
    user ?? queryClient.getQueryData<ProfileResponseDto>(profileKeys.me());
  const currentUserId = currentUser?.id || "anonymous";

  // Restore persistent draft on mount / conversationId / user change
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  const [prevUserId, setPrevUserId] = useState(currentUserId);
  const [message, setMessageState] = useState(() =>
    conversationId ? getDraft(currentUserId, conversationId)?.text || "" : "",
  );
  const [selectedAttachment, setSelectedAttachmentState] =
    useState<SelectedAttachment | null>(() =>
      conversationId
        ? getDraft(currentUserId, conversationId)?.attachment || null
        : null,
    );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Synchronize when switching conversations or accounts during render instead of effect
  if (prevConversationId !== conversationId || prevUserId !== currentUserId) {
    setPrevConversationId(conversationId);
    setPrevUserId(currentUserId);
    const draft = conversationId
      ? getDraft(currentUserId, conversationId)
      : undefined;
    setMessageState(draft?.text || "");
    setSelectedAttachmentState(draft?.attachment || null);
  }

  const setMessage = useCallback(
    (newText: string) => {
      setMessageState(newText);
      if (conversationId) {
        setDraft(currentUserId, conversationId, newText, selectedAttachment);
      }
    },
    [conversationId, currentUserId, selectedAttachment, setDraft],
  );

  const setSelectedAttachment = useCallback(
    (attachment: SelectedAttachment | null) => {
      setSelectedAttachmentState(attachment);
      if (conversationId) {
        setDraft(currentUserId, conversationId, message, attachment);
      }
    },
    [conversationId, currentUserId, message, setDraft],
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

      const isImage =
        !attachment ||
        attachment.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(attachment.uri);

      const optimisticMsg: MessageResponseDto = {
        id: `temp_${Date.now()}`,
        conversationId,
        clientMessageId,
        senderId: currentUser?.id || "",
        kind: attachment ? (isImage ? "image" : "document") : "text",
        text: textToSend || "",
        attachments: attachment
          ? [
              {
                mediaId: `temp_media_${Date.now()}`,
                url: attachment.uri,
                type: isImage ? "image" : "document",
                contentType:
                  attachment.mimeType ||
                  (isImage ? "image/jpeg" : "application/pdf"),
                sizeBytes: attachment.fileSize || 0,
                originalFilename: attachment.fileName || null,
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

    const initiatingSessionGen = tokenStorage.getSessionGeneration();
    const initiatingUserId = currentUserId;

    const textToSend = message.trim();
    const currentAttachment = selectedAttachment;
    const clientMessageId = generateUUID();
    const clientUploadId = currentAttachment ? generateUUID() : undefined;

    // 1. Move draft into durable outbox entry
    const outboxEntry: OutboxEntry = {
      clientMessageId,
      ownerId: currentUserId,
      conversationId,
      text: textToSend || undefined,
      attachment: currentAttachment,
      clientUploadId,
      uploadStage: currentAttachment ? "authorizing" : undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    addOutboxEntry(outboxEntry);

    // 2. Clear input state and draft storage
    setMessageState("");
    setSelectedAttachmentState(null);
    clearDraft(currentUserId, conversationId);
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
          clientUploadId,
          sessionGeneration: initiatingSessionGen,
          ownerId: initiatingUserId,
          onStageChange: (progress) => {
            // Guard against ended session before writing to outbox
            if (
              tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
              !useAuthStore.getState().isAuthenticated
            ) {
              return;
            }
            updateOutboxStatus(clientMessageId, "pending", {
              clientUploadId: progress.clientUploadId,
              uploadedMediaId: progress.mediaId,
              uploadStage: progress.stage,
            });
          },
        });

        // F8 FIX: Guard after every await before next authenticated operation or local write
        if (
          tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
          !useAuthStore.getState().isAuthenticated
        ) {
          console.warn(
            "🛑 [useSendChatMessage] Session changed/ended after uploadMedia; aborting message send.",
          );
          return;
        }

        uploadedMediaId = mediaAsset.id;
        updateOutboxStatus(clientMessageId, "pending", {
          uploadedMediaId: mediaAsset.id,
          uploadStage: "completed",
        });
      } catch (error: any) {
        // Guard: do not update state or show toasts if session ended / changed
        if (
          tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
          !useAuthStore.getState().isAuthenticated
        ) {
          return;
        }
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

    // F8 FIX: Guard before final mutation submission
    if (
      tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
      !useAuthStore.getState().isAuthenticated
    ) {
      console.warn(
        "🛑 [useSendChatMessage] Session changed/ended before message send mutation; aborting.",
      );
      return;
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
    currentUserId,
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
      if (!entry) return;

      // F4 FIX: Reject retry from another account owner
      if (entry.ownerId && entry.ownerId !== currentUserId) {
        console.error(
          "🛑 Cannot retry outbox entry belonging to another account",
        );
        showInfoToast(
          "Cannot retry message from another account",
          "Action Blocked",
        );
        return;
      }

      const initiatingSessionGen = tokenStorage.getSessionGeneration();
      const initiatingUserId = currentUserId;

      const textToSend = entry?.text;
      const attachment = entry?.attachment;
      let uploadedMediaId = entry?.uploadedMediaId;

      // Set state to pending
      updateOutboxStatus(clientMessageId, "pending");
      setOptimisticMessageStatus(clientMessageId, "pending");

      // Upload if media was not yet uploaded or verification failed
      if (attachment && entry.uploadStage !== "completed") {
        try {
          setIsUploadingAttachment(true);
          const mediaAsset = await uploadMedia({
            uri: attachment.uri,
            purpose: "message_attachment",
            fileName: attachment.fileName || undefined,
            mimeType: attachment.mimeType || undefined,
            sizeBytes: attachment.fileSize || undefined,
            clientUploadId: entry.clientUploadId,
            existingMediaId: entry.uploadedMediaId,
            existingStage: entry.uploadStage,
            sessionGeneration: initiatingSessionGen,
            ownerId: initiatingUserId,
            onStageChange: (progress) => {
              if (
                tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
                !useAuthStore.getState().isAuthenticated
              ) {
                return;
              }
              updateOutboxStatus(clientMessageId, "pending", {
                clientUploadId: progress.clientUploadId,
                uploadedMediaId: progress.mediaId,
                uploadStage: progress.stage,
              });
            },
          });

          // F8 FIX: Guard after await
          if (
            tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
            !useAuthStore.getState().isAuthenticated
          ) {
            return;
          }

          uploadedMediaId = mediaAsset.id;
          updateOutboxStatus(clientMessageId, "pending", {
            uploadedMediaId: mediaAsset.id,
            uploadStage: "completed",
          });
        } catch (error: any) {
          if (
            tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
            !useAuthStore.getState().isAuthenticated
          ) {
            return;
          }
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

      // F8 FIX: Guard before retrying mutation
      if (
        tokenStorage.getSessionGeneration() !== initiatingSessionGen ||
        !useAuthStore.getState().isAuthenticated
      ) {
        return;
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
      currentUserId,
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
