// Service managing all document-related interactions, including fetching, creating, updating, versions, export/import, and file uploads,
// providing a simplified interface for other modules without exposing direct API details.
import api from '@/lib/axiosIns';
import { apiRoutes } from "@/config/apiRoutes";
import { DocumentItem } from "../types/document.type";
import type { DocumentVersion } from "../types/docs.type";
import { extractResponseData } from "@/shared/utils/apiError";

/**
 * Normalize API response to extract data from various response envelope formats
 */
function normalize<T>(response: unknown, fallback: T): T {
  if (!response) return fallback;
  
  const res = response as { data?: unknown };
  
  if (typeof res.data === 'object' && res.data !== null) {
    const data = res.data as { data?: T };
    if (data.data !== undefined) {
      return data.data;
    }
    return data as T;
  }
  
  if (typeof res.data === 'object' && res.data !== null) {
    return res.data as T;
  }
  
  return fallback;
}

export const documentService = {
  listMine: async (): Promise<DocumentItem[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.BASE);
    return normalize<DocumentItem[]>(res, []);
  },
  getByWorkspace: async (workspaceId: string): Promise<DocumentItem[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.BY_WORKSPACE(workspaceId));
    return normalize<DocumentItem[]>(res, []);
  },
  upload: async (file: File, payload?: { name?: string; workspaceIds?: string[] }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (payload?.name) formData.append('name', payload.name);
    (payload?.workspaceIds ?? []).forEach((id) => formData.append('workspaceIds[]', id));
    const res = await api.post(apiRoutes.DOCUMENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  createOnline: async (name: string, content: string, workspaceIds?: string[]) => {
    const res = await api.post(apiRoutes.DOCUMENTS.CREATE_ONLINE, { name, content, workspaceIds });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  getContent: async (id: string): Promise<{ content: string }> => {
    const res = await api.get(apiRoutes.DOCUMENTS.CONTENT(id));
    return normalize<{ content: string }>(res, { content: '' });
  },
  updateContent: async (id: string, content: string): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.CONTENT(id), { content });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  createVersion: async (id: string, label: string): Promise<DocumentVersion> => {
    const res = await api.post(apiRoutes.DOCUMENTS.VERSIONS(id), { label });
    const raw = normalize<RawDocumentVersion>(res, {} as RawDocumentVersion);
    return mapDocumentVersion(raw);
  },
  getVersions: async (id: string): Promise<DocumentVersion[]> => {
    const res = await api.get(apiRoutes.DOCUMENTS.VERSIONS(id));
    const rawVersions = normalize<RawDocumentVersion[]>(res, []);
    return rawVersions.map(mapDocumentVersion);
  },
  restoreVersion: async (id: string, versionId: string): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.VERSION_RESTORE(id, versionId));
    return normalize<DocumentItem>(res, {} as DocumentItem);
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
    const responseData = extractResponseData(res, { html: '' });
    return (responseData as { html?: string }).html ?? '';
  },
  rename: async (id: string, name: string): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.BY_ID(id), { name });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  delete: async (id: string) => {
    const res = await api.delete(apiRoutes.DOCUMENTS.BY_ID(id));
    return normalize<{ success: boolean }>(res, { success: false });
  },
  attach: async (id: string, workspaceIds: string[]): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.ATTACH(id), { workspaceIds });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  detach: async (id: string, workspaceId: string): Promise<DocumentItem> => {
    const res = await api.post(apiRoutes.DOCUMENTS.DETACH(id), { workspaceId });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  updateWorkspaces: async (id: string, workspaceIds: string[]): Promise<DocumentItem> => {
    const res = await api.patch(apiRoutes.DOCUMENTS.WORKSPACES(id), { workspaceIds });
    return normalize<DocumentItem>(res, {} as DocumentItem);
  },
  getViewBlob: async (id: string): Promise<Blob> => {
    const res = await api.get(apiRoutes.DOCUMENTS.VIEW(id), {
      responseType: "blob",
    });
    return res.data;
  },
  getPreviewHtml: async (id: string): Promise<string> => {
    const res = await api.get<string>(apiRoutes.DOCUMENTS.PREVIEW(id), {
      responseType: "text",
      transformResponse: [(data) => data],
    });
    return res.data;
  },
  viewUrl: (id: string) => api.getUri({ url: apiRoutes.DOCUMENTS.VIEW(id) }),
  previewUrl: (id: string) => api.getUri({ url: apiRoutes.DOCUMENTS.PREVIEW(id) }),
  downloadUrl: (id: string) => api.getUri({ url: apiRoutes.DOCUMENTS.DOWNLOAD(id) }),
};

// Internal type for raw document version from API
interface RawDocumentVersion {
  _id?: string;
  documentId?: string;
  htmlSnapshot?: string;
  label?: string;
  version?: number;
  createdBy?: {
    _id?: string;
    fullName?: string;
  };
  createdAt?: string;
}

function mapDocumentVersion(raw: RawDocumentVersion): DocumentVersion {
  return {
    id: raw._id ?? '',
    pageId: raw.documentId ?? '',
    htmlSnapshot: raw.htmlSnapshot ?? "",
    label: raw.label ?? '',
    version: raw.version ?? 0,
    createdBy: raw.createdBy
      ? {
          _id: raw.createdBy._id ?? '',
          fullName: raw.createdBy.fullName || "Anonymous",
        }
      : { _id: "", fullName: "Anonymous" },
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}
