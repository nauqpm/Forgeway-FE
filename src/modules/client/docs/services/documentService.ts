// Service managing all document-related interactions, including fetching, creating, updating, versions, export/import, and file uploads,
// providing a simplified interface for other modules without exposing direct API details.
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { DocumentItem } from "../types/document.type";
import type { DocumentVersion } from "../types/docs.type";

const normalize = <T>(res: any): T => res?.data?.data ?? res?.data ?? res;

export const documentService = {
  listMine: async (): Promise<DocumentItem[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.BASE);
    return normalize<DocumentItem[]>(res);
  },
  getByWorkspace: async (workspaceId: string): Promise<DocumentItem[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.BY_WORKSPACE(workspaceId));
    return normalize<DocumentItem[]>(res);
  },
  upload: async (file: File, payload?: { name?: string; workspaceIds?: string[] }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (payload?.name) formData.append("name", payload.name);
    (payload?.workspaceIds ?? []).forEach((id) => formData.append("workspaceIds[]", id));
    const res = await api.post(apiRoutes.DOCUMENTS.UPLOAD, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalize<DocumentItem>(res);
  },
  createOnline: async (name: string, content: string, workspaceIds?: string[]) => {
    const res = await api.post(apiRoutes.DOCUMENTS.CREATE_ONLINE, { name, content, workspaceIds });
    return normalize<DocumentItem>(res);
  },
  getContent: async (id: string): Promise<{ content: string }> => {
    const res = await api.get(apiRoutes.DOCUMENTS.CONTENT(id));
    return normalize<{ content: string }>(res);
  },
  updateContent: async (id: string, content: string): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.CONTENT(id), { content });
    return normalize<DocumentItem>(res);
  },
  createVersion: async (id: string, label: string): Promise<DocumentVersion> => {
    const res = await api.post(apiRoutes.DOCUMENTS.VERSIONS(id), { label });
    return mapDocumentVersion(normalize<any>(res));
  },
  getVersions: async (id: string): Promise<DocumentVersion[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.VERSIONS(id));
    return normalize<any[]>(res).map(mapDocumentVersion);
  },
  restoreVersion: async (id: string, versionId: string): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.VERSION_RESTORE(id, versionId));
    return normalize<DocumentItem>(res);
  },
  exportDocx: async (id: string, title: string): Promise<void> => {
    const res = await api.get(apiRoutes.DOCUMENTS.EXPORT_DOCX(id), {
      responseType: "blob",
    });
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, "_") || "document";
    link.href = url;
    link.setAttribute("download", `${safeTitle}.docx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  importDocx: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(apiRoutes.DOCUMENTS.IMPORT_DOCX, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.html ?? res.data?.data?.html ?? "";
  },
  rename: async (id: string, name: string): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.BY_ID(id), { name });
    return normalize<DocumentItem>(res);
  },
  delete: async (id: string) => {
    const res = await api.delete(apiRoutes.DOCUMENTS.BY_ID(id));
    return normalize<{ success: boolean }>(res);
  },
  attach: async (id: string, workspaceIds: string[]): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.ATTACH(id), { workspaceIds });
    return normalize<DocumentItem>(res);
  },
  detach: async (id: string, workspaceId: string): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.DETACH(id), { workspaceId });
    return normalize<DocumentItem>(res);
  },
  updateWorkspaces: async (id: string, workspaceIds: string[]): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.WORKSPACES(id), { workspaceIds });
    return normalize<DocumentItem>(res);
  },
  viewUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL}${apiRoutes.DOCUMENTS.VIEW(id)}`,
  previewUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL}${apiRoutes.DOCUMENTS.PREVIEW(id)}`,
  downloadUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL}${apiRoutes.DOCUMENTS.DOWNLOAD(id)}`,
};

function mapDocumentVersion(raw: any): DocumentVersion {
  return {
    id: raw._id,
    pageId: raw.documentId,
    htmlSnapshot: raw.htmlSnapshot ?? "",
    label: raw.label,
    version: raw.version,
    createdBy: raw.createdBy
      ? {
          _id: raw.createdBy._id,
          fullName: raw.createdBy.fullName || "Anonymous",
        }
      : { _id: "", fullName: "Anonymous" },
    createdAt: raw.createdAt,
  };
}
