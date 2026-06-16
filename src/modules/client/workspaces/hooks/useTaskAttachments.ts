import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { attachmentService } from "../services/attachmentService";
import { queryKeys } from "@/common/constants/queryKeys";
import {
  isImageAttachment,
  isPreviewableAttachment,
  TaskAttachment,
  UploadQueueItem,
} from "../types/attachment.type";

interface UseTaskAttachmentsOptions {
  workspaceId: string;
  taskId: string;
  isArchived: boolean;
  currentUserId?: string | null;
  accessToken?: string | null;
}

const createQueueId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toQueueItem = (file: File): UploadQueueItem => ({
  id: createQueueId(),
  fileName: file.name,
  fileSize: file.size,
  mimeType: file.type || "application/octet-stream",
  progress: 0,
  status: "uploading",
});

export const useTaskAttachments = ({
  workspaceId,
  taskId,
  isArchived,
  currentUserId,
  accessToken,
}: UseTaskAttachmentsOptions) => {
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadQueueItem[]>([]);
  const isMountedRef = useRef(true);
  const taskScopeRef = useRef(`${workspaceId}:${taskId}`);
  const uploadControllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const nextScope = `${workspaceId}:${taskId}`;
    if (taskScopeRef.current === nextScope) return;

    Object.values(uploadControllersRef.current).forEach((controller) => controller.abort());
    uploadControllersRef.current = {};
    setUploadingFiles([]);
    taskScopeRef.current = nextScope;
  }, [taskId, workspaceId]);

  const setQueueSafely = useCallback((updater: (current: UploadQueueItem[]) => UploadQueueItem[]) => {
    if (!isMountedRef.current) return;
    setUploadingFiles(updater);
  }, []);

  const queryKey = useMemo(
    () => queryKeys.tasks.attachments(workspaceId, taskId),
    [taskId, workspaceId],
  );

  const attachmentsQuery = useQuery({
    queryKey,
    queryFn: () => attachmentService.listAttachments({ workspaceId, taskId, accessToken }),
    enabled: Boolean(workspaceId && taskId),
  });

  const attachments = attachmentsQuery.data ?? [];
  const imageAttachments = attachments.filter(isImageAttachment);
  const documentAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));
  const previewableAttachments = attachments.filter(isPreviewableAttachment);

  const updateQueueItem = useCallback((id: string, updates: Partial<UploadQueueItem>) => {
    setQueueSafely((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, [setQueueSafely]);

  const uploadFiles = useCallback(
    (files: File[]) => {
      if (isArchived) {
        toast.error("Archived tasks cannot receive new attachments.");
        return;
      }

      const nextItems = files.map((file) => ({
        file,
        queueItem: toQueueItem(file),
      }));
      if (nextItems.length === 0) return;

      setQueueSafely((current) => [...nextItems.map(({ queueItem }) => queueItem), ...current]);

      const uploadJobs = nextItems.map(({ file, queueItem }) => {
        const controller = new AbortController();
        uploadControllersRef.current = {
          ...uploadControllersRef.current,
          [queueItem.id]: controller,
        };

        return attachmentService
          .uploadAttachment({
            workspaceId,
            taskId,
            file,
            accessToken,
            signal: controller.signal,
            onProgress: (progress) => updateQueueItem(queueItem.id, { progress }),
          })
          .then((attachment) => {
            updateQueueItem(queueItem.id, {
              progress: 100,
              status: "success",
              attachment,
            });
            return attachment;
          })
          .catch((caught) => {
            if (controller.signal.aborted) return null;
            updateQueueItem(queueItem.id, {
              status: "error",
              error: attachmentService.getErrorMessage(caught, "Upload failed."),
            });
            return null;
          })
          .finally(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [queueItem.id]: _removed, ...remaining } = uploadControllersRef.current;
            uploadControllersRef.current = remaining;
          });
      });

      Promise.all(uploadJobs).then((results) => {
        if (results.some(Boolean)) {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    },
    [
      accessToken,
      isArchived,
      queryClient,
      queryKey,
      setQueueSafely,
      taskId,
      updateQueueItem,
      workspaceId,
    ],
  );

  const clearQueueItem = useCallback((id: string) => {
    uploadControllersRef.current[id]?.abort();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _removed, ...remaining } = uploadControllersRef.current;
    uploadControllersRef.current = remaining;
    setQueueSafely((current) => current.filter((item) => item.id !== id));
  }, [setQueueSafely]);

  const canDeleteAttachment = useCallback(
    (attachment: TaskAttachment) =>
      !isArchived && Boolean(currentUserId) && currentUserId === attachment.uploadedBy,
    [currentUserId, isArchived],
  );

  const deleteAttachment = useCallback(
    async (attachment: TaskAttachment) => {
      if (isArchived) {
        toast.error("Archived task attachments cannot be deleted.");
        return;
      }
      if (!canDeleteAttachment(attachment)) {
        toast.error("Only the uploader can delete this attachment.");
        return;
      }

      try {
        await attachmentService.deleteAttachment({
          workspaceId,
          taskId,
          attachmentId: attachment.id,
          accessToken,
        });
        await queryClient.invalidateQueries({ queryKey });
        toast.success("Attachment deleted.");
      } catch (caught) {
        toast.error(attachmentService.getErrorMessage(caught, "Could not delete attachment."));
      }
    },
    [
      accessToken,
      canDeleteAttachment,
      isArchived,
      queryClient,
      queryKey,
      taskId,
      workspaceId,
    ],
  );

  const downloadAttachment = useCallback(
    async (attachment: TaskAttachment) => {
      try {
        await attachmentService.downloadAttachment({
          workspaceId,
          taskId,
          attachmentId: attachment.id,
          fileName: attachment.originalName,
          accessToken,
        });
      } catch (caught) {
        toast.error(attachmentService.getErrorMessage(caught, "Could not download attachment."));
      }
    },
    [accessToken, taskId, workspaceId],
  );

  return {
    attachments,
    imageAttachments,
    documentAttachments,
    previewableAttachments,
    uploadingFiles,
    isLoading: attachmentsQuery.isFetching,
    error: attachmentsQuery.error,
    refetch: attachmentsQuery.refetch,
    uploadFiles,
    clearQueueItem,
    canDeleteAttachment,
    deleteAttachment,
    downloadAttachment,
  };
};
