// Service managing all interactions related to document page comments,
// including API calls to fetch, create, reply, edit, delete, and resolve comments,
// providing a simple interface for components without direct API handling.
import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
export interface CommentAuthor {
  id: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface PageComment {
  id: string;
  content: string;
  authorId: string;
  author?: CommentAuthor;
  targetType: string;
  targetId: string;
  parentId?: string;
  inlineId?: string;
  mentions: string[];
  isDeleted: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  editedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  replies?: PageComment[];
  anchorStatus?: string;
}

export interface CreatePageCommentPayload {
  workspaceId: string;
  content: string;
  targetType: 'page';
  targetId: string;
  inlineId?: string;
  parentId?: string;
  mentions?: string[];
}

// ──────────────────────────────────────────────────────────────
// API methods
// ──────────────────────────────────────────────────────────────

/** Fetch all comments for a page as threaded list (root + replies) */
async function getThreadedComments(
  workspaceId: string,
  pageId: string,
): Promise<PageComment[]> {
  const res = await api.get(apiRoutes.COMMENTS.THREADED('page', pageId), {
    params: { workspaceId },
  });
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

/** Create a new comment (root or reply) */
async function createComment(payload: CreatePageCommentPayload): Promise<PageComment> {
  const res = await api.post(apiRoutes.COMMENTS.BASE, payload);
  return res.data?.data ?? res.data;
}

/** Reply to an existing comment */
async function replyToComment(
  workspaceId: string,
  parentId: string,
  content: string,
  pageId: string,
): Promise<PageComment> {
  return createComment({
    workspaceId,
    content,
    targetType: 'page',
    targetId: pageId,
    parentId,
  });
}

/** Update comment content */
async function updateComment(id: string, content: string): Promise<PageComment> {
  const res = await api.put(apiRoutes.COMMENTS.BY_ID(id), { content });
  return res.data?.data ?? res.data;
}

/** Delete a comment (soft delete) */
async function deleteComment(id: string): Promise<void> {
  await api.delete(apiRoutes.COMMENTS.BY_ID(id));
}

/** Mark a comment thread as resolved */
async function resolveComment(id: string): Promise<PageComment> {
  const res = await api.post(apiRoutes.COMMENTS.RESOLVE(id));
  return res.data?.data ?? res.data;
}

/** Reopen a resolved comment thread */
async function unresolveComment(id: string): Promise<PageComment> {
  const res = await api.post(apiRoutes.COMMENTS.UNRESOLVE(id));
  return res.data?.data ?? res.data;
}

/** Get comment count for a page */
async function getCommentCount(
  workspaceId: string,
  pageId: string,
): Promise<number> {
  const res = await api.get(apiRoutes.COMMENTS.COUNT('page', pageId), {
    params: { workspaceId },
  });
  const data = res.data?.data ?? res.data;
  return data?.count ?? 0;
}

export const pageCommentsService = {
  getThreadedComments,
  createComment,
  replyToComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
  getCommentCount,
};
