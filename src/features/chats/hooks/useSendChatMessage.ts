import { useState, useCallback } from "react";
import axios from "axios";
import { mediaApi } from "@/features/media/api";
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
        const name = currentAttachment.fileName || `attachment_${Date.now()}.jpg`;
        const type = (currentAttachment.mimeType ||
          (currentAttachment.uri.endsWith(".png")
            ? "image/png"
            : currentAttachment.uri.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg")) as any;
        const size = currentAttachment.fileSize || 500000;

        const uploadAuth = await mediaApi.createUpload({
          clientUploadId: generateUUID(),
          purpose: "message_attachment",
          contentType: type,
          sizeBytes: size,
          originalFilename: name,
        });

        if (uploadAuth.upload) {
          const formData = new FormData();
          if (uploadAuth.upload.fields) {
            Object.entries(uploadAuth.upload.fields).forEach(([key, val]) => {
              formData.append(key, String(val));
            });
          }

          formData.append("file", {
            uri: currentAttachment.uri,
            name: name,
            type: type,
          } as any);

          await axios.post(uploadAuth.upload.url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          await mediaApi.completeUpload(uploadAuth.media.id);
          uploadedMediaId = uploadAuth.media.id;
        }
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
