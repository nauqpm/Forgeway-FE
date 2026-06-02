"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MentionsInput, Mention } from "react-mentions";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { taskService, TaskComment } from "../services/taskService";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";

type MentionMember = {
  id: string;
  display: string;
};

type RawMemberDto = {
  id?: string;
  _id?: string;
  userId?:
  | { id?: string; _id?: string; fullName?: string; email?: string }
  | string;
  user?: { id?: string; _id?: string; fullName?: string; email?: string };
  fullName?: string;
  email?: string;
};

type TaskCommentsProps = {
  workspaceId: string;
  taskId: string;
  isArchived: boolean;
  isDeleted?: boolean;
};

const normalizeResponse = <T,>(payload: unknown): T => {
  const p = payload as Record<string, unknown>;
  return (p?.data
    ? ((p.data as Record<string, unknown>)?.data ?? p.data)
    : payload) as T;
};

const toMentionMember = (m: RawMemberDto): MentionMember | null => {
  const userObj =
    typeof m.userId === "object" && m.userId !== null ? m.userId : m.user;
  const id =
    userObj?.id ??
    userObj?._id ??
    m.id ??
    m._id ??
    (typeof m.userId === "string" ? m.userId : undefined);
  const display = userObj?.fullName || userObj?.email || m.fullName || m.email;
  if (!id || !display) return null;
  return { id, display };
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getAuthorInitials = (author: TaskComment["author"]): string => {
  const name = author?.fullName || author?.email || "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const renderRichText = (content: string) => {
  // Matches both `[@Name](id)` and `@[Name](id)` syntax in case of legacy data
  const mentionRegex = /(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="text-[#0052CC] dark:text-[#4C9AFF] bg-[#E9F2FF] dark:bg-[#0052CC]/20 px-1 py-0.5 rounded font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = mentionRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

interface CommentNode extends TaskComment {
  children: CommentNode[];
}

const buildCommentTree = (flatComments: TaskComment[]): CommentNode[] => {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  flatComments.forEach((c) => map.set(c.id, { ...c, children: [] }));

  flatComments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn = (a: CommentNode, b: CommentNode) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  Array.from(map.values()).forEach((node) => node.children.sort(sortFn));
  return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export default function TaskComments({
  workspaceId,
  taskId,
  isArchived,
  isDeleted = false,
}: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [commentInput, setCommentInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const commentsKey = useMemo(
    () => ["taskComments", workspaceId, taskId],
    [workspaceId, taskId],
  );
  const membersKey = useMemo(
    () => ["workspaceMembers", workspaceId],
    [workspaceId],
  );

  const { data: comments = [], isFetching: isLoadingComments } = useQuery({
    queryKey: commentsKey,
    queryFn: () => taskService.getComments(workspaceId, taskId),
    enabled: Boolean(workspaceId && taskId) && !isDeleted,
    staleTime: 30_000,
  });

  const { data: mentionMembers = [] } = useQuery<MentionMember[]>({
    queryKey: membersKey,
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      const payload = normalizeResponse<unknown>(response);
      const arr = Array.isArray(payload) ? (payload as RawMemberDto[]) : [];
      return arr
        .map(toMentionMember)
        .filter((m): m is MentionMember => m !== null);
    },
    enabled: Boolean(workspaceId) && !isDeleted,
    staleTime: 5 * 60_000,
  });

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      taskService.createComment(workspaceId, taskId, content, replyingToId),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<TaskComment[]>(commentsKey) ?? [];
      const optimistic: TaskComment = {
        id: `optimistic-${Date.now()}`,
        workspaceId,
        content,
        authorId: currentUserId ?? "",
        author: user
          ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar,
          }
          : null,
        targetType: "task",
        targetId: taskId,
        parentId: replyingToId || null,
        mentions: [],
        isDeleted: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<TaskComment[]>(commentsKey, [...prev, optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      toast.error("Failed to post comment");
    },
    onSuccess: () => {
      setReplyingToId(null);
      setCommentInput("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      if (!commentId) throw new Error("Missing comment id");
      return taskService.updateComment(workspaceId, taskId, commentId, content);
    },
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<TaskComment[]>(commentsKey) ?? [];
      queryClient.setQueryData<TaskComment[]>(
        commentsKey,
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content, editedAt: new Date().toISOString() }
            : c,
        ),
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update comment",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
      setEditingId(null);
      setEditContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => {
      if (!commentId) throw new Error("Missing comment id");
      return taskService.deleteComment(workspaceId, taskId, commentId);
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<TaskComment[]>(commentsKey) ?? [];
      queryClient.setQueryData<TaskComment[]>(
        commentsKey,
        prev.filter((c) => c.id !== commentId),
      );
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete comment",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmed = commentInput.trim();
    if (!trimmed || isArchived || createMutation.isPending) return;
    createMutation.mutate(trimmed);
    setCommentInput("");
  }, [commentInput, isArchived, createMutation]);

  const handleEditSave = useCallback(() => {
    if (!editingId || !editContent.trim() || editMutation.isPending) return;
    editMutation.mutate({ commentId: editingId, content: editContent.trim() });
  }, [editingId, editContent, editMutation]);

  const handleEditStart = useCallback((comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditContent("");
  }, []);

  const handleReplyStart = useCallback((comment: TaskComment) => {
    const authorName = comment.author?.fullName || comment.author?.email || "Unknown";
    const authorId = comment.author?.id || comment.authorId;
    setReplyingToId(comment.id);
    setCommentInput(`[@${authorName}](${authorId}) `);
    document.querySelector<HTMLInputElement>('.tc-m__input')?.focus();
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const renderCommentNode = (node: CommentNode, depth: number = 0) => {
    const authorName = node.author?.fullName || node.author?.email || "Unknown";
    const initials = getAuthorInitials(node.author);
    const isEditing = editingId === node.id;
    const isOwnComment = Boolean(
      currentUserId &&
      (node.authorId === currentUserId || node.author?.id === currentUserId),
    );

    const visualDepth = Math.min(depth, 3);

    return (
      <div key={node.id} className="mt-4">
        <div className="flex gap-4" style={{ marginLeft: `${visualDepth * 1.5}rem` }}>
          <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
            {node.author?.avatar ? (
              <img src={node.author.avatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-900 dark:text-white text-sm font-semibold">{authorName}</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDateTime(node.createdAt)}</span>
              {node.editedAt && <span className="text-gray-400 dark:text-gray-500 text-xs">(edited)</span>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSave();
                    }
                    if (e.key === "Escape") handleEditCancel();
                  }}
                  className="w-full border border-[#0052CC] rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEditSave}
                    disabled={editMutation.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0052CC] text-white text-xs font-medium rounded transition-colors disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {editMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {renderRichText(node.content)}
                </p>
                <div className="flex gap-3 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {!isArchived && (
                    <button
                      className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleReplyStart(node)}
                    >
                      Reply
                    </button>
                  )}
                  {!isArchived && isOwnComment && (
                    <>
                      <button
                        onClick={() => handleEditStart(node)}
                        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(node.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Safe early return after all hooks — no API calls made when isDeleted
  if (isDeleted) return null;

  if (isLoadingComments && sortedComments.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input — hidden when archived */}
      {!isArchived && (
        <>
          {replyingToId && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
              <span>Replying to comment...</span>
              <button
                onClick={() => setReplyingToId(null)}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/40 p-0.5 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-4 pt-2">
            <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user ? getAuthorInitials(user as any) : "U"}
            </div>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:border-[#0052CC] transition-colors p-4 cursor-text relative">
            <div className="mb-4 text-sm relative z-50">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    .tc-m__control{min-height:36px}
                    .tc-m__input{width:100%;outline:none;border:none;background:transparent;color:inherit;font-family:inherit;font-size:inherit}
                    .tc-m__suggestions__list{background:#F4F5F7;border:1px solid #DFE1E6;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);overflow:hidden;z-index:100;position:absolute;min-width:200px;margin-top:4px}
                    .tc-m__suggestions__item{padding:8px 12px;cursor:pointer;color:#172B4D}
                    .tc-m__suggestions__item--focused{background:#EBECF0}

                    .dark .tc-m__suggestions__list{background:#1F2937;border-color:#374151}
                    .dark .tc-m__suggestions__item{color:#F3F4F6}
                    .dark .tc-m__suggestions__item--focused{background:#374151}
                  `,
                }}
              />
              <MentionsInput
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Add a comment... (@ to mention)"
                className="tc-m w-full bg-transparent text-gray-900 dark:text-white text-sm"
                a11ySuggestionsListLabel="Suggested mentions"
              >
                <Mention
                  trigger="@"
                  data={mentionMembers}
                  markup="[@__display__](__id__)"
                  renderSuggestion={(
                    suggestion,
                    _search,
                    highlightedDisplay,
                  ) => (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {suggestion.display?.toString().charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {highlightedDisplay}
                      </span>
                    </div>
                  )}
                  className="text-[#0052CC] bg-[#E9F2FF] dark:text-[#4C9AFF] dark:bg-[#0052CC]/20"
                  displayTransform={(id, display) => `@${display}`}
                />
              </MentionsInput>
            </div>

            {!commentInput && (
              <div className="flex items-center gap-2">
                <span
                  onClick={() =>
                    setCommentInput("Who is working on this...?")
                  }
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer font-medium bg-white dark:bg-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  Who is working on this...?
                </span>
                <span
                  onClick={() => setCommentInput("Status update...")}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer font-medium bg-white dark:bg-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  Status update...
                </span>
              </div>
            )}

            {commentInput && (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0052CC] hover:bg-[#0065FF] text-white text-xs font-medium rounded transition-colors disabled:opacity-60"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => setCommentInput("")}
                  className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-medium rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Pro tip: press{" "}
                <span className="font-bold bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                  Enter
                </span>{" "}
                to comment
              </p>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Comment list */}
      {commentTree.length > 0 ? (
        <div className="space-y-2 mt-2">
          {commentTree.map((node) => renderCommentNode(node, 0))}
        </div>
      ) : (
        !isLoadingComments && (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No comments yet.
          </div>
        )
      )}
    </div>
  );
}
