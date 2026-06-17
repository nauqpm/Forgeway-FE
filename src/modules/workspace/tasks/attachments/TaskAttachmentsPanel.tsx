"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Paperclip, Plus, RefreshCw, X } from "lucide-react";
import { useAttachmentDropzone } from "@/modules/workspace/shared/hooks/useAttachmentDropzone";
import { useTaskAttachments } from "@/modules/workspace/shared/hooks/useTaskAttachments";
import { isPreviewableAttachment, TaskAttachment } from "@/modules/workspace/shared/types/attachment.type";
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
    uploadErrorMessage,
    clearUploadError,
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
      className={`relative space-y-3 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] p-4 ${className}`}
    >
      <AttachmentDropOverlay visible={isDraggingFiles} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-[4px] bg-white dark:bg-[#202020] p-2 text-[#787774] dark:text-[#9B9A97] border border-[#EAEAEA] dark:border-white/[0.06]">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Attachments
            </h3>
            <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{panelDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-[4px] p-2 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-white dark:hover:bg-[#202020] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
            aria-label="Refresh attachments"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isArchived}
            className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] px-3 py-2 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
          Could not load attachments.
        </div>
      )}

      {uploadErrorMessage && (
        <div className="flex items-start gap-2 rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.32)] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.16)] px-3 py-2 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">{uploadErrorMessage}</p>
          <button
            type="button"
            onClick={clearUploadError}
            className="rounded-[4px] p-0.5 text-[#9F2F2D] transition-colors hover:bg-[#F5C6C7] dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.24)]"
            aria-label="Dismiss upload error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AttachmentUploadQueue items={uploadingFiles} onClear={clearQueueItem} />

      {!hasContent && !isLoading && (
        <div className="rounded-[6px] border border-dashed border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-4 py-6 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
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
