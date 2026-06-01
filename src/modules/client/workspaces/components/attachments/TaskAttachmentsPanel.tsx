"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Plus, RefreshCw } from "lucide-react";
import { useAttachmentDropzone } from "../../hooks/useAttachmentDropzone";
import { useTaskAttachments } from "../../hooks/useTaskAttachments";
import { isPreviewableAttachment, TaskAttachment } from "../../types/attachment.type";
import AttachmentDocumentList from "./AttachmentDocumentList";
import AttachmentDropOverlay from "./AttachmentDropOverlay";
import AttachmentImageGrid from "./AttachmentImageGrid";
import AttachmentPreviewLightbox from "./AttachmentPreviewLightbox";
import AttachmentUploadQueue from "./AttachmentUploadQueue";

interface TaskAttachmentsPanelProps {
  workspaceId: string;
  taskId: string;
  isArchived: boolean;
  currentUserId?: string | null;
  accessToken?: string | null;
  className?: string;
}

export default function TaskAttachmentsPanel({
  workspaceId,
  taskId,
  isArchived,
  currentUserId,
  accessToken,
  className = "",
}: TaskAttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  useEffect(() => {
    setPreviewAttachment(null);
  }, [taskId, workspaceId]);

  const {
    imageAttachments,
    documentAttachments,
    previewableAttachments,
    uploadingFiles,
    isLoading,
    error,
    refetch,
    uploadFiles,
    clearQueueItem,
    canDeleteAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useTaskAttachments({
    workspaceId,
    taskId,
    isArchived,
    currentUserId,
    accessToken,
  });

  const { isDraggingFiles, getDropzoneProps } = useAttachmentDropzone({
    disabled: isArchived,
    onFiles: uploadFiles,
  });

  const attachmentCount = imageAttachments.length + documentAttachments.length;
  const hasContent = attachmentCount > 0 || uploadingFiles.length > 0;
  const panelDescription = useMemo(() => {
    if (isArchived) return "This task is archived. Attachments are read-only.";
    return "Drop files here, paste screenshots, or select files.";
  }, [isArchived]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    uploadFiles(files);
    event.target.value = "";
  };

  const onPreview = (attachment: TaskAttachment) => {
    if (!isPreviewableAttachment(attachment)) return;
    setPreviewAttachment(attachment);
  };

  return (
    <section
      {...getDropzoneProps()}
      className={`relative space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60 ${className}`}
    >
      <AttachmentDropOverlay visible={isDraggingFiles} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded bg-white p-2 text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Attachments
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{panelDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Refresh attachments"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isArchived}
            className="inline-flex items-center gap-2 rounded bg-[#0052CC] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#357BFF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onInputChange}
            disabled={isArchived}
          />
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          Could not load attachments.
        </div>
      )}

      <AttachmentUploadQueue items={uploadingFiles} onClear={clearQueueItem} />

      {!hasContent && !isLoading && (
        <div className="rounded border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No attachments yet.
        </div>
      )}

      <AttachmentImageGrid
        attachments={imageAttachments}
        canDeleteAttachment={canDeleteAttachment}
        onPreview={onPreview}
        onDownload={downloadAttachment}
        onDelete={deleteAttachment}
      />

      <AttachmentDocumentList
        attachments={documentAttachments}
        canDeleteAttachment={canDeleteAttachment}
        onPreview={onPreview}
        onDownload={downloadAttachment}
        onDelete={deleteAttachment}
      />

      <AttachmentPreviewLightbox
        workspaceId={workspaceId}
        taskId={taskId}
        accessToken={accessToken}
        attachments={previewableAttachments}
        activeAttachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        onSelect={setPreviewAttachment}
        onDownload={downloadAttachment}
      />
    </section>
  );
}
