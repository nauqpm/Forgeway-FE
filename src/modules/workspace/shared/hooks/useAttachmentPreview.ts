import { useEffect, useState } from "react";
import { attachmentService } from "../services/attachmentService";
import { TaskAttachment } from "../types/attachment.type";

interface UseAttachmentPreviewOptions {
  workspaceId: string;
  taskId: string;
  attachment: TaskAttachment | null;
  accessToken?: string | null;
}

export const useAttachmentPreview = ({
  workspaceId,
  taskId,
  attachment,
  accessToken,
}: UseAttachmentPreviewOptions) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachmentId = attachment?.id;
  const attachmentMimeType = attachment?.mimeType;

  useEffect(() => {
    if (!attachmentId || !attachmentMimeType) {
      setObjectUrl(null);
      setTextContent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let nextObjectUrl: string | null = null;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    setTextContent(null);
    setObjectUrl(null);

    attachmentService
      .getPreviewBlob({
        workspaceId,
        taskId,
        attachmentId,
        accessToken,
        signal: controller.signal,
      })
      .then(async (blob) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(blob);
        if (attachmentMimeType === "text/plain") {
          const nextTextContent = await blob.text();
          if (cancelled) return;
          setTextContent(nextTextContent);
        }
        setObjectUrl(nextObjectUrl);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(attachmentService.getErrorMessage(caught, "Preview is not available."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [accessToken, attachmentId, attachmentMimeType, taskId, workspaceId]);

  return {
    objectUrl,
    textContent,
    isLoading,
    error,
  };
};
