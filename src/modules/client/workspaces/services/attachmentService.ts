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
  accessToken
    ? {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    : undefined;

const getErrorMessage = (error: unknown, fallback: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = (error as any)?.response?.data?.message || (error as any)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

const getUploadErrorMessage = (error: unknown, fallback = "Upload failed. Please try again.") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (error as any)?.response?.status;
  const message = getErrorMessage(error, fallback).toLowerCase();

  if (status === 400) {
    if (message.includes("file extension") || message.includes("file type") || message.includes("mime type")) {
      return "Invalid file format. Please upload a supported file type.";
    }

    if (message.includes("file too large") || message.includes("too large") || message.includes("size")) {
      return "File is too large. Please upload a smaller attachment.";
    }

    return "Could not upload this attachment. Please check the file and try again.";
  }

  if (status === 413) {
    return "File is too large. Please upload a smaller attachment.";
  }

  if (status === 401 || status === 403) {
    return "You do not have permission to upload attachments to this task.";
  }

  if (!status) {
    return "Network issue while uploading attachment. Please check your connection and try again.";
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
      ...authConfig(accessToken),
      headers: {
        ...authConfig(accessToken)?.headers,
        "Content-Type": "multipart/form-data",
      },
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
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  async deleteAttachment({
    workspaceId,
    taskId,
    attachmentId,
    accessToken,
  }: AttachmentRequestContext & { attachmentId: string }): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK_ATTACHMENT(workspaceId, taskId, attachmentId), authConfig(accessToken));
  },

  getErrorMessage,
  getUploadErrorMessage,
};
