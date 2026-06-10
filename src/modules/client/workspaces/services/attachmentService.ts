import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import {
  AttachmentRequestContext,
  AttachmentUploadInput,
  normalizeTaskAttachment,
  type RawTaskAttachment,
  TaskAttachment,
} from "../types/attachment.type";

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
  const message = (error as any)?.response?.data?.message || (error as any)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
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
};
