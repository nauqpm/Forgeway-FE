import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import {
  AttachmentRequestContext,
  AttachmentUploadInput,
  normalizeTaskAttachment,
  type RawTaskAttachment,
  TaskAttachment,
} from "../types/attachment.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeResponseData = <T>(payload: any): T => payload?.data?.data ?? payload?.data ?? payload;

const authConfig = (accessToken?: string | null) =>
  ({
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
  });

const formDataConfig = (accessToken?: string | null) => ({
  headers: authConfig(accessToken).headers,
});

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  ".ade",
  ".adp",
  ".app",
  ".apk",
  ".bat",
  ".bin",
  ".cmd",
  ".com",
  ".cpl",
  ".dll",
  ".dmg",
  ".exe",
  ".gadget",
  ".hta",
  ".ins",
  ".iso",
  ".jar",
  ".js",
  ".jse",
  ".lib",
  ".lnk",
  ".msi",
  ".msp",
  ".mst",
  ".pif",
  ".ps1",
  ".scr",
  ".sh",
  ".sys",
  ".vb",
  ".vbe",
  ".vbs",
  ".ws",
  ".wsf",
]);

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".csv",
  ".doc",
  ".docx",
  ".gif",
  ".jpeg",
  ".jpg",
  ".json",
  ".md",
  ".mp4",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".rtf",
  ".svg",
  ".txt",
  ".webp",
  ".xls",
  ".xlsx",
  ".zip",
]);

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/json",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "text/csv",
  "text/markdown",
  "text/plain",
  "video/mp4",
]);

const ADDITIONAL_ATTACHMENT_MIME_TYPES_BY_EXTENSION = new Map([
  [
    ".mp4",
    new Set([
      "application/mp4",
      "application/octet-stream",
      "video/x-m4v",
    ]),
  ],
]);

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = (error as any)?.response?.data?.message || (error as any)?.message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(" ");
  }
  return typeof message === "string" && message.trim() ? message : fallback;
};

const SERVER_UPLOAD_LIMIT_MESSAGE =
  "File is too large for the server upload limit. Please upload a smaller file.";

const validateUploadFile = (file: File) => {
  const extension = getFileExtension(file.name);
  const mimeType = (file.type || "").toLowerCase();

  if (!extension || BLOCKED_ATTACHMENT_EXTENSIONS.has(extension) || !ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return "Invalid file format. Please upload a supported file type.";
  }

  const extensionMimeTypes = ADDITIONAL_ATTACHMENT_MIME_TYPES_BY_EXTENSION.get(extension);

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType) && !extensionMimeTypes?.has(mimeType)) {
    return "Invalid file format. Please upload a supported file type.";
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return "File is too large. Please upload a smaller attachment.";
  }

  return null;
};

const getUploadErrorMessage = (error: unknown, fallback = "Upload failed. Please try again.", file?: File) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (error as any)?.response?.status;
  const serverMessage = getErrorMessage(error, "");
  const message = (serverMessage || fallback).toLowerCase();

  if (status === 400) {
    if (message.includes("file extension") || message.includes("file type") || message.includes("mime type")) {
      return "Invalid file format. Please upload a supported file type.";
    }

    if (message.includes("file too large") || message.includes("too large") || message.includes("size")) {
      return "File is too large. Please upload a smaller attachment.";
    }

    if (message.includes("multipart") || message.includes("boundary") || message.includes("form")) {
      return "Could not read the uploaded file. Please try uploading it again.";
    }

    return serverMessage || "Could not upload this attachment. Please check the file and try again.";
  }

  if (status === 413) {
    return SERVER_UPLOAD_LIMIT_MESSAGE;
  }

  if (status === 401 || status === 403) {
    return "You do not have permission to upload attachments to this task.";
  }

  if (!status) {
    if (file && file.size <= MAX_ATTACHMENT_SIZE && validateUploadFile(file) === null) {
      return SERVER_UPLOAD_LIMIT_MESSAGE;
    }

    return "Upload could not complete. Please try again.";
  }

  if (status >= 500) {
    return "Server issue while uploading attachment. Please try again later.";
  }

  return getErrorMessage(error, fallback);
};
export const attachmentService = {
  async listAttachments({ workspaceId, taskId, accessToken }: AttachmentRequestContext): Promise<TaskAttachment[]> {
    const response = await api.get(
      apiRoutes.TASKS.BOARD_TASK_ATTACHMENTS(workspaceId, taskId),
      authConfig(accessToken)
    );
    const payload = normalizeResponseData<unknown>(response);
    return Array.isArray(payload) ? (payload as RawTaskAttachment[]).map(normalizeTaskAttachment) : [];
  },

  async uploadAttachment({
    workspaceId,
    taskId,
    file,
    accessToken,
    onProgress,
    signal,
  }: AttachmentUploadInput): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(apiRoutes.TASKS.BOARD_TASK_ATTACHMENTS(workspaceId, taskId), formData, {
      ...formDataConfig(accessToken),
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
      signal,
    });

    return normalizeTaskAttachment(normalizeResponseData<RawTaskAttachment>(response));
  },

  async getPreviewBlob({
    workspaceId,
    taskId,
    attachmentId,
    accessToken,
    signal,
  }: AttachmentRequestContext & { attachmentId: string; signal?: AbortSignal }): Promise<Blob> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_ATTACHMENT_PREVIEW(workspaceId, taskId, attachmentId), {
      ...authConfig(accessToken),
      responseType: "blob",
      signal,
    });
    return response.data;
  },

  async downloadAttachment({
    workspaceId,
    taskId,
    attachmentId,
    fileName,
    accessToken,
  }: AttachmentRequestContext & { attachmentId: string; fileName: string }): Promise<void> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_ATTACHMENT_DOWNLOAD(workspaceId, taskId, attachmentId), {
      ...authConfig(accessToken),
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    try {
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  },

  async deleteAttachment({
    workspaceId,
    taskId,
    attachmentId,
    accessToken,
  }: AttachmentRequestContext & { attachmentId: string }): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK_ATTACHMENT(workspaceId, taskId, attachmentId), authConfig(accessToken));
  },

  validateUploadFile,
  getErrorMessage,
  getUploadErrorMessage,
};
