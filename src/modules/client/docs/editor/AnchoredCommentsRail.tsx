"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";
import type { PageComment } from "../services/commentsService";
import CommentThread from "./CommentThread";

type AnchoredCommentPosition = {
  comment: PageComment;
  top: number;
};

interface AnchoredCommentsRailProps {
  editor: Editor | null;
  pageElement: HTMLDivElement | null;
  comments: PageComment[];
  activeCommentId: string | null;
  onSetActiveCommentId: (id: string | null) => void;
  onReply: (parentId: string, content: string) => Promise<any>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUnresolve: (commentId: string) => Promise<void>;
}

export default function AnchoredCommentsRail({
  editor,
  pageElement,
  comments,
  activeCommentId,
  onSetActiveCommentId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
}: AnchoredCommentsRailProps) {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id || "";
  const [positions, setPositions] = useState<AnchoredCommentPosition[]>([]);

  const measure = () => {
    const editorDom = editor?.view?.dom;
    if (!editorDom || !pageElement) {
      setPositions([]);
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const next = comments
      .filter((comment) => comment.inlineId && comment.anchorStatus !== "orphaned")
      .map((comment) => {
        const marker = editorDom.querySelector<HTMLElement>(
          `[data-comment-id="${comment.inlineId}"]`,
        );
        if (!marker) return null;

        const markerRect = marker.getBoundingClientRect();
        return {
          comment,
          top: Math.max(0, markerRect.top - pageRect.top),
        };
      })
      .filter((item): item is AnchoredCommentPosition => Boolean(item))
      .sort((a, b) => a.top - b.top);

    setPositions(next);
  };

  useLayoutEffect(() => {
    measure();
  }, [editor, pageElement, comments, activeCommentId]);

  useEffect(() => {
    if (!editor) return;

    const rerender = () => measure();
    editor.on("update", rerender);
    editor.on("selectionUpdate", rerender);
    window.addEventListener("resize", rerender);

    return () => {
      editor.off("update", rerender);
      editor.off("selectionUpdate", rerender);
      window.removeEventListener("resize", rerender);
    };
  }, [editor, pageElement, comments]);

  if (!positions.length) return null;

  return (
    <div className="relative h-full pointer-events-none">
      {positions.map(({ comment, top }, index) => (
        <div
          key={comment.id}
          className="absolute left-0 right-0 pointer-events-auto"
          style={{ top: `${Math.max(top, index * 8)}px` }}
        >
          <CommentThread
            comment={comment}
            currentUserId={currentUserId}
            isActive={activeCommentId === comment.id}
            onActivate={() => onSetActiveCommentId(comment.id)}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onResolve={onResolve}
            onUnresolve={onUnresolve}
          />
        </div>
      ))}
    </div>
  );
}
