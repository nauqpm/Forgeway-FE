// Service managing document page interactions, including API calls to get list, create, update content, version history, export/import, and other operations,
import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';
import type {
  Document,
  PageApiResponse,
  CreatePagePayload,
  UpdatePagePayload,
  DocumentVersion,
} from '../types/docs.type';

// ──────────────────────────────────────────────────────────────
// Mapper: BE response → FE Document
// ──────────────────────────────────────────────────────────────
function mapPage(raw: PageApiResponse): Document {
  return {
    id: raw._id,
    title: raw.title,
    content: raw.content,
    parentId: raw.parentId ?? null,
    workspaceId: raw.workspaceId,
    slug: raw.slug,
    authorId: raw.authorId,
    lastEditedBy: raw.lastEditedBy
      ? {
          _id: raw.lastEditedBy._id,
          fullName: raw.lastEditedBy.fullName ?? raw.lastEditedBy.fullName ?? 'Unknown',
        }
      : null,
    version: raw.version,
    labels: raw.labels ?? [],
    versionHistory: raw.versionHistory ?? [],
    source: 'docs',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ──────────────────────────────────────────────────────────────
// API methods
// ──────────────────────────────────────────────────────────────

/** Fetch root-level pages (no parent) for a workspace */
async function getRootPages(workspaceKey: string): Promise<Document[]> {
  const res = await api.get(apiRoutes.PAGES.ROOT_PAGES(workspaceKey));
  const data: PageApiResponse[] = res.data?.data ?? res.data;
  return data.map(mapPage);
}

/** Fetch all pages in a workspace */
async function getWorkspacePages(workspaceId: string): Promise<Document[]> {
  const res = await api.get(apiRoutes.PAGES.BY_WORKSPACE(workspaceId));
  const data: PageApiResponse[] = res.data?.data ?? res.data;
  return data.map(mapPage);
}

/** Fetch direct children of a page (lazy tree) */
async function getChildren(parentId: string): Promise<Document[]> {
  const res = await api.get(apiRoutes.PAGES.CHILDREN(parentId));
  const data: PageApiResponse[] = res.data?.data ?? res.data;
  return data.map(mapPage);
}

/** Fetch a single page by ID */
async function getPageById(id: string): Promise<Document> {
  const res = await api.get(apiRoutes.PAGES.BY_ID(id));
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Fetch a single page by slug */
async function getPageBySlug(slug: string): Promise<Document> {
  const res = await api.get(apiRoutes.PAGES.BY_SLUG(slug));
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Create a new page */
async function createPage(payload: CreatePagePayload): Promise<Document> {
  const res = await api.post(apiRoutes.PAGES.BASE, payload);
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Partially update a page (title, content, labels) */
async function updatePage(id: string, payload: UpdatePagePayload): Promise<Document> {
  const res = await api.patch(apiRoutes.PAGES.BY_ID(id), payload);
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Delete a page and all its descendants */
async function deletePage(id: string): Promise<void> {
  await api.delete(apiRoutes.PAGES.BY_ID(id));
}

/** Synchronize page state / autosave */
async function syncPage(
  id: string,
  payload: {
    title?: string;
    yjsState?: number[];
    contentJson?: string;
    content?: string;
    plainTextSnapshot?: string;
  },
): Promise<Document> {
  const res = await api.patch(apiRoutes.PAGES.SYNC(id), payload);
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

interface RawDocumentVersion {
  _id: string;
  pageId: string;
  yjsState?: number[];
  contentJson?: string;
  htmlSnapshot?: string;
  content?: string;
  label: string;
  version: number;
  createdBy?: { _id: string; fullName?: string } | null;
  createdAt: string;
}

function mapVersion(raw: RawDocumentVersion): DocumentVersion {
  return {
    id: raw._id,
    pageId: raw.pageId,
    yjsState: raw.yjsState,
    contentJson: raw.contentJson,
    htmlSnapshot: raw.htmlSnapshot ?? raw.content ?? "",
    label: raw.label,
    version: raw.version,
    createdBy: raw.createdBy ? {
      _id: raw.createdBy._id,
      fullName: raw.createdBy.fullName || "Anonymous",
    } : { _id: "", fullName: "Anonymous" },
    createdAt: raw.createdAt,
  };
}

/** Create a named version of the page */
async function createVersion(id: string, label: string): Promise<DocumentVersion> {
  const res = await api.post(apiRoutes.PAGES.VERSIONS(id), { label });
  const raw = res.data?.data ?? res.data;
  return mapVersion(raw);
}

/** Get all versions of a page */
async function getVersions(id: string): Promise<DocumentVersion[]> {
  const res = await api.get(apiRoutes.PAGES.VERSIONS(id));
  const data: RawDocumentVersion[] = res.data?.data ?? res.data;
  return data.map(mapVersion);
}

/** Restore a page to a specific version */
async function restoreVersion(id: string, versionId: string): Promise<Document> {
  const res = await api.post(apiRoutes.PAGES.VERSION_RESTORE(id, versionId));
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Export a page as DOCX */
async function exportDocx(id: string, title: string): Promise<void> {
  const res = await api.get(apiRoutes.PAGES.EXPORT_DOCX(id), {
    responseType: 'blob',
  });
  
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_') || 'document';
  link.setAttribute('download', `${safeTitle}.docx`);
  
  document.body.appendChild(link);
  link.click();
  
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/** Import DOCX file and get HTML */
async function importDocx(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post(apiRoutes.PAGES.IMPORT_DOCX, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data?.html ?? res.data?.data?.html ?? '';
}

export const pagesService = {
  getWorkspacePages,
  getRootPages,
  getChildren,
  getPageById,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  syncPage,
  createVersion,
  getVersions,
  restoreVersion,
  exportDocx,
  importDocx,
};
