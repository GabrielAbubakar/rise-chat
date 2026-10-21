import { useState, useCallback } from "react";
import { uploadMedia } from "@/features/media/services";
import { generateUUID, showApiErrorToast } from "@/shared/utils";
import { SelectedAttachment } from "../components";

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
  const [message, setMessage] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<SelectedAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && !selectedAttachment) || !conversationId) return;

    const textToSend = message.trim();
    const currentAttachment = selectedAttachment;

    setMessage("");
    setSelectedAttachment(null);
    sendTypingStop();

    let uploadedMediaId: string | undefined = undefined;

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
      } catch (error: any) {
        showApiErrorToast(error, "Failed to upload attachment");
        setIsUploadingAttachment(false);
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    sendMessageMutation.mutate({
      clientMessageId: generateUUID(),
      text: textToSend || undefined,
      attachmentMediaIds: uploadedMediaId ? [uploadedMediaId] : undefined,
    });

    if (onMessageSent) {
      onMessageSent();
    }
  }, [
    message,
    selectedAttachment,
    conversationId,
    sendTypingStop,
    sendMessageMutation,
    onMessageSent,
  ]);

  return {
    message,
    setMessage,
    selectedAttachment,
    setSelectedAttachment,
    isUploadingAttachment,
    handleSendMessage,
  };
}
