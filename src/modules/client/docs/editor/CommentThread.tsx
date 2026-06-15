// Component representing a comment thread in the document,
// including the root comment and replies (if any). 
// Each comment thread displays author info, creation time, comment content, 
// and actions such as reply, edit, delete, resolve, or reopen comment.
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import type { PageComment } from "../services/commentsService";

interface CommentThreadProps {
  comment: PageComment;
  currentUserId: string;
  isActive: boolean;
  onActivate: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReply: (parentId: string, content: string) => Promise<any>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUnresolve: (commentId: string) => Promise<void>;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("vi-VN");
}

function getInitial(name?: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Single comment bubble ─────────────────────────────────────
function CommentBubble({
  comment,
  currentUserId,
  isRoot,
  onEdit,
  onDelete,
}: {
  comment: PageComment;
  currentUserId: string;
  isRoot: boolean;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = comment.authorId === currentUserId;
  const authorName = comment.author?.fullName || "Anonymous";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent.trim() !== comment.content) {
      await onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`group relative flex gap-2 ${isRoot ? "" : "ml-6 mt-1.5"}`}>
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
        style={{ backgroundColor: getAvatarColor(comment.authorId) }}
        title={authorName}
      >
        {comment.author?.avatar ? (
          <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitial(authorName)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 truncate">
            {authorName}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {timeAgo(comment.createdAt)}
            {comment.editedAt && " (edited)"}
          </span>
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-[12px] p-2 border border-indigo-300 dark:border-indigo-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={handleSaveEdit}
                className="px-2 py-0.5 text-[10px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>
        )}
      </div>

      {/* Action menu (owner only) */}
      {isOwner && !isEditing && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-5 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => {
                  onDelete(comment.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main CommentThread component ───────────────────────────────
export default function CommentThread({
  comment,
  currentUserId,
  isActive,
  onActivate,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
}: CommentThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyOpen && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyOpen]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending) return;
    setIsSending(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setReplyOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div
      data-comment-thread-id={comment.inlineId || comment.id}
      onClick={onActivate}
      className={`group/thread relative border rounded-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md"
          : "border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
      } ${comment.isResolved ? "opacity-60" : ""}`}
    >
      {/* Thread header */}
      <div className="px-3 pt-3 pb-1">
        <CommentBubble
          comment={comment}
          currentUserId={currentUserId}
          isRoot
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="px-3 pb-1 border-t border-gray-100 dark:border-gray-800/50 mt-1 pt-2">
          {comment.replies.map((reply) => (
            <CommentBubble
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isRoot={false}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-100 dark:border-gray-800/50">
        {!comment.isResolved ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReplyOpen(!replyOpen);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            >
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(comment.id);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
            >
              <Check className="w-3 h-3" /> Resolve
            </button>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnresolve(comment.id);
            }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reopen
          </button>
        )}
      </div>

      {/* Reply input */}
      {replyOpen && !comment.isResolved && (
        <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800/50">
          <div className="flex items-end gap-1.5 mt-2">
            <textarea
              ref={replyInputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              className="flex-1 text-[12px] px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
              rows={1}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || isSending}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Resolved badge */}
      {comment.isResolved && (
        <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold shadow-sm">
          <Check className="w-2.5 h-2.5" /> Resolved
        </div>
      )}
    </div>
  );
}
