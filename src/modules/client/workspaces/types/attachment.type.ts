export interface AttachmentUploader {
  id: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface TaskAttachment {
  id: string;
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

export const isPreviewableAttachment = (attachment: Pick<TaskAttachment, "mimeType">) =>
  attachment.mimeType.startsWith("image/") ||
  attachment.mimeType === "application/pdf" ||
  attachment.mimeType === "text/plain";

export const isImageAttachment = (attachment: Pick<TaskAttachment, "mimeType">) =>
  attachment.mimeType.startsWith("image/");
