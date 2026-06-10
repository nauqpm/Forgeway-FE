import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';
import { DocumentItem } from '../types/document.type';

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
    formData.append('file', file);
    if (payload?.name) formData.append('name', payload.name);
    (payload?.workspaceIds ?? []).forEach((id) => formData.append('workspaceIds[]', id));
    const res = await api.post(apiRoutes.DOCUMENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
