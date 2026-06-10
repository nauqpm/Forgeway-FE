// Hook quản lý tất cả các tương tác liên quan đến nhận xét trên một trang tài liệu, 
// bao gồm việc lấy danh sách nhận xét, tạo mới, trả lời, chỉnh sửa, xóa và giải quyết nhận xét,
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  pageCommentsService,
  type PageComment,
  type CreatePageCommentPayload,
} from "../services/commentsService";

interface UsePageCommentsProps {
  pageId: string | undefined;
  enabled?: boolean;
}

export function usePageComments({ pageId, enabled = true }: UsePageCommentsProps) {
  const [comments, setComments] = useState<PageComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const fetchedPageRef = useRef<string | null>(null);

  // ── Fetch threaded comments ────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!pageId || !enabled) return;

    setIsLoading(true);
    try {
      const data = await pageCommentsService.getThreadedComments(pageId);
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch page comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, enabled]);

  useEffect(() => {
    if (pageId && enabled && fetchedPageRef.current !== pageId) {
      fetchedPageRef.current = pageId;
      void fetchComments();
    }
  }, [pageId, enabled, fetchComments]);

  // ── Create a new root comment ──────────────────────────────
  const addComment = useCallback(
    async (content: string, inlineId?: string) => {
      if (!pageId) return null;

      try {
        const payload: CreatePageCommentPayload = {
          content,
          targetType: "page",
          targetId: pageId,
          inlineId,
        };
        const newComment = await pageCommentsService.createComment(payload);
        // Refetch to get proper threading
        await fetchComments();
        return newComment;
      } catch (err) {
        console.error("Failed to add comment:", err);
        return null;
      }
    },
    [pageId, fetchComments],
  );

  // ── Reply to a comment ─────────────────────────────────────
  const replyToComment = useCallback(
    async (parentId: string, content: string) => {
      if (!pageId) return null;

      try {
        const reply = await pageCommentsService.replyToComment(parentId, content, pageId);
        await fetchComments();
        return reply;
      } catch (err) {
        console.error("Failed to reply to comment:", err);
        return null;
      }
    },
    [pageId, fetchComments],
  );

  // ── Update comment ─────────────────────────────────────────
  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        await pageCommentsService.updateComment(commentId, content);
        await fetchComments();
      } catch (err) {
        console.error("Failed to update comment:", err);
      }
    },
    [fetchComments],
  );

  // ── Delete comment ─────────────────────────────────────────
  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.deleteComment(commentId);
        await fetchComments();
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    },
    [fetchComments],
  );

  // ── Resolve / Unresolve ────────────────────────────────────
  const resolveComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.resolveComment(commentId);
        await fetchComments();
      } catch (err) {
        console.error("Failed to resolve comment:", err);
      }
    },
    [fetchComments],
  );

  const unresolveComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.unresolveComment(commentId);
        await fetchComments();
      } catch (err) {
        console.error("Failed to unresolve comment:", err);
      }
    },
    [fetchComments],
  );

  // ── Filtered comments ──────────────────────────────────────
  const visibleComments = showResolved
    ? comments
    : comments.filter((c) => !c.isResolved);

  const resolvedCount = comments.filter((c) => c.isResolved).length;
  const openCount = comments.filter((c) => !c.isResolved).length;

  return {
    comments: visibleComments,
    allComments: comments,
    isLoading,
    activeCommentId,
    setActiveCommentId,
    showResolved,
    setShowResolved,
    resolvedCount,
    openCount,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    fetchComments,
  };
}
