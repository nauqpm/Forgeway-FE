// Main sidebar component to display list of comments,
// allowing users to add, reply, edit, delete, and
// change the status (resolved / unresolved) of comments.
"use client";

import React, { useState, useRef } from "react";
import {
  MessageSquarePlus,
  MessageSquare,
  ChevronDown,
  Send,
  Loader2,
  X,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";
import type { PageComment } from "../services/commentsService";
import CommentThread from "./CommentThread";

interface CommentsSidebarProps {
  pageId: string | undefined;
  editor: Editor | null;
  comments: PageComment[];
  isLoading: boolean;
  activeCommentId: string | null;
  showResolved: boolean;
  resolvedCount: number;
  openCount: number;
  onSetActiveCommentId: (id: string | null) => void;
  onSetShowResolved: (show: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddComment: (content: string, inlineId?: string) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReply: (parentId: string, content: string) => Promise<any>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUnresolve: (commentId: string) => Promise<void>;
}

export default function CommentsSidebar({
  pageId,
  editor,
  comments,
  isLoading,
  activeCommentId,
  showResolved,
  resolvedCount,
  openCount,
  onSetActiveCommentId,
  onSetShowResolved,
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
}: CommentsSidebarProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id || "";

  // ── Add new comment (can be inline) ─────────────────────
  const handleAddComment = async () => {
    if (!newContent.trim() || isSending) return;

    setIsSending(true);
    try {
      let inlineId: string | undefined;

      // If there is a text selection in the editor, create an inline comment
      if (editor && !editor.state.selection.empty) {
        inlineId = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        editor.chain().focus().setComment(inlineId).run();
      }

      await onAddComment(newContent.trim(), inlineId);
      setNewContent("");
      setIsComposing(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
    if (e.key === "Escape") {
      setIsComposing(false);
      setNewContent("");
    }
  };

  // ── Click comment to highlight in editor ───────────────────
  const handleActivateComment = (comment: PageComment) => {
    onSetActiveCommentId(comment.id);

    if (editor && comment.inlineId) {
      // Find the comment mark in the editor and scroll to it
      const { state } = editor;
      const { doc } = state;

      let foundPos: number | null = null;
      doc.descendants((node, pos) => {
        if (foundPos !== null) return false;
        if (node.isText) {
          const marks = node.marks || [];
          for (const mark of marks) {
            if (mark.type.name === "comment" && mark.attrs.commentId === comment.inlineId) {
              foundPos = pos;
              return false;
            }
          }
        }
        return true;
      });

      if (foundPos !== null) {
        editor.commands.setTextSelection(foundPos);
        editor.commands.scrollIntoView();
      }
    }
  };

  if (!pageId) return null;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200/60 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
              Comments
            </h3>
            {openCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {openCount}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setIsComposing(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            title="Add new comment"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter: resolved / open */}
        {resolvedCount > 0 && (
          <button
            onClick={() => onSetShowResolved(!showResolved)}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showResolved ? "rotate-180" : ""}`}
            />
            {showResolved
              ? "Hide resolved comments"
              : `Show ${resolvedCount} resolved comments`}
          </button>
        )}
      </div>

      {/* New comment composer */}
      {isComposing && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              New comment
            </span>
            <button
              onClick={() => {
                setIsComposing(false);
                setNewContent("");
              }}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {editor && !editor.state.selection.empty && (
            <div className="mb-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                💡 The selected text will be linked to this comment
              </p>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter comment..."
            className="w-full text-[12px] px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            rows={3}
            autoFocus
          />
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <button
              onClick={() => {
                setIsComposing(false);
                setNewContent("");
              }}
              className="px-2.5 py-1 text-[10px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={!newContent.trim() || isSending}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              No comments yet
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[180px]">
              Select text in the document to add a comment, or click the + button above
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isActive={activeCommentId === comment.id}
              onActivate={() => handleActivateComment(comment)}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onUnresolve={onUnresolve}
            />
          ))
        )}
      </div>
    </div>
  );
}
