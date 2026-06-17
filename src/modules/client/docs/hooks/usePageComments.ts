"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/common/constants/queryKeys";
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
  const queryClient = useQueryClient();
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const commentsQuery = useQuery<PageComment[]>({
    queryKey: queryKeys.docs.comments(pageId ?? ""),
    queryFn: () => pageCommentsService.getThreadedComments(pageId!),
    enabled: enabled && !!pageId,
  });

  const invalidateComments = useCallback(async () => {
    if (!pageId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.docs.comments(pageId) });
  }, [pageId, queryClient]);

  const addCommentMutation = useMutation({
    mutationFn: (payload: CreatePageCommentPayload) => pageCommentsService.createComment(payload),
    onSuccess: invalidateComments,
  });

  const addComment = useCallback(
    async (content: string, inlineId?: string) => {
      if (!pageId) return null;
      try {
        return await addCommentMutation.mutateAsync({
          content,
          targetType: "page",
          targetId: pageId,
          inlineId,
        });
      } catch (err) {
        console.error("Failed to add comment:", err);
        return null;
      }
    },
    [addCommentMutation, pageId],
  );

  const replyToComment = useCallback(
    async (parentId: string, content: string) => {
      if (!pageId) return null;

      try {
        const reply = await pageCommentsService.replyToComment(parentId, content, pageId);
        await invalidateComments();
        return reply;
      } catch (err) {
        console.error("Failed to reply to comment:", err);
        return null;
      }
    },
    [invalidateComments, pageId],
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        await pageCommentsService.updateComment(commentId, content);
        await invalidateComments();
      } catch (err) {
        console.error("Failed to update comment:", err);
      }
    },
    [invalidateComments],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.deleteComment(commentId);
        await invalidateComments();
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    },
    [invalidateComments],
  );

  const resolveComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.resolveComment(commentId);
        await invalidateComments();
      } catch (err) {
        console.error("Failed to resolve comment:", err);
      }
    },
    [invalidateComments],
  );

  const unresolveComment = useCallback(
    async (commentId: string) => {
      try {
        await pageCommentsService.unresolveComment(commentId);
        await invalidateComments();
      } catch (err) {
        console.error("Failed to unresolve comment:", err);
      }
    },
    [invalidateComments],
  );

  const allComments = commentsQuery.data ?? [];
  const visibleComments = showResolved ? allComments : allComments.filter((comment) => !comment.isResolved);

  return {
    comments: visibleComments,
    allComments,
    isLoading: commentsQuery.isLoading,
    activeCommentId,
    setActiveCommentId,
    showResolved,
    setShowResolved,
    resolvedCount: allComments.filter((comment) => comment.isResolved).length,
    openCount: allComments.filter((comment) => !comment.isResolved).length,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    fetchComments: commentsQuery.refetch,
  };
}
