export interface AttachmentUploader {
  id: string;
  _id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface TaskAttachment {
  id: string;
  _id?: string;
  workspaceId: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  targetType: "task" | string;
  targetId: string;
  uploadedBy: string;
  uploader?: AttachmentUploader | null;
  downloadCount: number;
  isDeleted: boolean;
  createdAt: string;
}

type RawUploader = Partial<AttachmentUploader> & {
  _id?: string;
};

export type RawTaskAttachment = Partial<Omit<TaskAttachment, "uploader" | "uploadedBy">> & {
  id?: string;
  _id?: string;
  uploadedBy?: string | { id?: string; _id?: string };
  uploader?: RawUploader | null;
};

export type UploadQueueStatus = "uploading" | "success" | "error";

export interface UploadQueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  progress: number;
  status: UploadQueueStatus;
  error?: string;
  attachment?: TaskAttachment;
}

export interface AttachmentRequestContext {
  workspaceId: string;
  taskId: string;
  accessToken?: string | null;
}

export interface AttachmentUploadInput extends AttachmentRequestContext {
  file: File;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

const normalizeUploader = (uploader?: RawUploader | null): AttachmentUploader | null =>
  uploader
    ? {
        ...uploader,
        id: uploader.id ?? uploader._id ?? "",
      }
    : null;

const normalizeUploadedBy = (uploadedBy?: RawTaskAttachment["uploadedBy"]) => {
  if (typeof uploadedBy === "string") return uploadedBy;
  return uploadedBy?.id ?? uploadedBy?._id ?? "";
};

export const normalizeTaskAttachment = (attachment: RawTaskAttachment): TaskAttachment => ({
  ...attachment,
  id: attachment.id ?? attachment._id ?? "",
  workspaceId: attachment.workspaceId ?? "",
  originalName: attachment.originalName ?? attachment.filename ?? "attachment",
  filename: attachment.filename ?? attachment.originalName ?? "attachment",
  mimeType: attachment.mimeType ?? "application/octet-stream",
  size: attachment.size ?? 0,
  targetType: attachment.targetType ?? "task",
  targetId: attachment.targetId ?? "",
  uploadedBy: normalizeUploadedBy(attachment.uploadedBy),
  uploader: normalizeUploader(attachment.uploader),
  downloadCount: attachment.downloadCount ?? 0,
  isDeleted: attachment.isDeleted ?? false,
  createdAt: attachment.createdAt ?? "",
});

export const isPreviewableAttachment = (attachment: Pick<TaskAttachment, "mimeType">) =>
  attachment.mimeType.startsWith("image/") ||
  attachment.mimeType === "application/pdf" ||
  attachment.mimeType === "text/plain";

export const isImageAttachment = (attachment: Pick<TaskAttachment, "mimeType">) =>
  attachment.mimeType.startsWith("image/");
