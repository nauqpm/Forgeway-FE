import api from '@/common/services/api.service';
import { apiRoutes } from '@/config/apiRoutes';
import type {
  Document,
  PageApiResponse,
  CreatePagePayload,
  UpdatePagePayload,
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
          fullName: raw.lastEditedBy.fullName ?? raw.lastEditedBy.username ?? "Unknown",
        }
      : null,
    version: raw.version,
    status: raw.status,
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

/** Create a new page */
async function createPage(payload: CreatePagePayload): Promise<Document> {
  const res = await api.post(apiRoutes.PAGES.BASE, payload);
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Partially update a page (title, content, status, labels) */
async function updatePage(id: string, payload: UpdatePagePayload): Promise<Document> {
  const res = await api.patch(apiRoutes.PAGES.BY_ID(id), payload);
  const raw: PageApiResponse = res.data?.data ?? res.data;
  return mapPage(raw);
}

/** Delete a page and all its descendants */
async function deletePage(id: string): Promise<void> {
  await api.delete(apiRoutes.PAGES.BY_ID(id));
}

export const pagesService = {
  getRootPages,
  getChildren,
  getPageById,
  createPage,
  updatePage,
  deletePage,
};
