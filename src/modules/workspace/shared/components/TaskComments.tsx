"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MentionsInput, Mention } from "react-mentions";
import { AlertCircle, Check, Loader2, Pencil, Trash2, X } from "lucide-react";

import { taskService, TaskComment } from "../services/taskService";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { queryKeys } from "@/shared/constants/queryKeys";

type MentionMember = {
  id: string;
  display: string;
};

type RawMemberDto = {
  id?: string;
  _id?: string;
  userId?: { id?: string; _id?: string; fullName?: string; email?: string } | string;
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

type CreateCommentInput = {
  content: string;
  mentions: string[];
  parentId?: string | null;
};

const normalizeResponse = <T,>(payload: unknown): T => {
  const p = payload as Record<string, unknown>;
  return (p?.data ? ((p.data as Record<string, unknown>)?.data ?? p.data) : payload) as T;
};

const getCommentErrorMessage = (error: unknown, fallback: string): string => {
  const candidate = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const apiMessage = candidate.response?.data?.message;

  if (Array.isArray(apiMessage)) return apiMessage[0] ?? fallback;
  return apiMessage || candidate.message || fallback;
};

const toMentionMember = (m: RawMemberDto): MentionMember | null => {
  const userObj = typeof m.userId === "object" && m.userId !== null ? m.userId : m.user;
  const id = userObj?.id ?? userObj?._id ?? m.id ?? m._id ?? (typeof m.userId === "string" ? m.userId : undefined);
  const display = userObj?.fullName || userObj?.email || m.fullName || m.email;
  if (!id || !display) return null;
  return { id, display };
};

const toMentionMembers = (members: RawMemberDto[]): MentionMember[] =>
  members.map(toMentionMember).filter((member): member is MentionMember => member !== null);

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

const MENTION_MARKUP_REGEX = /(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g;

const renderRichText = (content: string) => {
  const mentionRegex = new RegExp(MENTION_MARKUP_REGEX.source, "g");
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
        className="text-[#2563EB] dark:text-[#3B82F6] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-1 py-0.5 rounded-[3px] font-medium"
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

const extractMentionIds = (content: string): string[] => {
  const mentionRegex = new RegExp(MENTION_MARKUP_REGEX.source, "g");
  const ids = new Set<string>();
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const id = match[2]?.trim();
    if (id) ids.add(id);
  }

  return Array.from(ids);
};

const getReplyAuthorMention = (comment: TaskComment): string => {
  const authorName = comment.author?.fullName || comment.author?.email || "Unknown";
  const authorId = comment.author?.id || comment.authorId;
  if (!authorId) return "";
  return `[@${authorName}](${authorId}) `;
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

  const sortFn = (a: CommentNode, b: CommentNode) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  Array.from(map.values()).forEach((node) => node.children.sort(sortFn));
  return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export default function TaskComments({ workspaceId, taskId, isArchived, isDeleted = false }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [commentInput, setCommentInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const commentsKey = useMemo(() => queryKeys.tasks.detailComments(workspaceId, taskId), [workspaceId, taskId]);
  const membersKey = useMemo(() => queryKeys.workspaces.members(workspaceId), [workspaceId]);

  const { data: comments = [], isFetching: isLoadingComments } = useQuery({
    queryKey: commentsKey,
    queryFn: () => taskService.getComments(workspaceId, taskId),
    enabled: Boolean(workspaceId && taskId) && !isDeleted,
    staleTime: 30_000,
  });

  const { data: mentionMembers = [] } = useQuery<RawMemberDto[], Error, MentionMember[]>({
    queryKey: membersKey,
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      const payload = normalizeResponse<unknown>(response);
      return Array.isArray(payload) ? (payload as RawMemberDto[]) : [];
    },
    select: toMentionMembers,
    enabled: Boolean(workspaceId) && !isDeleted,
    staleTime: 5 * 60_000,
  });

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [comments]
  );

  const createMutation = useMutation({
    mutationFn: ({ content, mentions, parentId }: CreateCommentInput) =>
      taskService.createComment(workspaceId, taskId, content, parentId ?? null, mentions),
    onMutate: async ({ content, mentions, parentId }) => {
      setActionError(null);
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
        parentId: parentId || null,
        mentions,
        isDeleted: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<TaskComment[]>(commentsKey, [...prev, optimistic]);
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      setActionError(getCommentErrorMessage(error, "Failed to post comment."));
    },
    onSuccess: (_data, variables) => {
      if (variables.parentId) {
        setReplyingToId(null);
        setReplyContent("");
      }
      setCommentInput("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => {
      if (!commentId) throw new Error("Missing comment id");
      return taskService.updateComment(workspaceId, taskId, commentId, content);
    },
    onMutate: async ({ commentId, content }) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<TaskComment[]>(commentsKey) ?? [];
      queryClient.setQueryData<TaskComment[]>(
        commentsKey,
        prev.map((c) => (c.id === commentId ? { ...c, content, editedAt: new Date().toISOString() } : c))
      );
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      setActionError(getCommentErrorMessage(error, "Failed to update comment."));
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
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const prev = queryClient.getQueryData<TaskComment[]>(commentsKey) ?? [];
      queryClient.setQueryData<TaskComment[]>(
        commentsKey,
        prev.filter((c) => c.id !== commentId)
      );
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentsKey, ctx.prev);
      setActionError(getCommentErrorMessage(error, "Failed to delete comment."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmed = commentInput.trim();
    if (!trimmed || isArchived || createMutation.isPending) return;
    createMutation.mutate({
      content: trimmed,
      mentions: extractMentionIds(trimmed),
      parentId: null,
    });
    setCommentInput("");
  }, [commentInput, isArchived, createMutation]);

  const handleReplySubmit = useCallback((parentId: string) => {
    const trimmed = replyContent.trim();
    if (!trimmed || isArchived || createMutation.isPending) return;
    createMutation.mutate({
      content: trimmed,
      mentions: extractMentionIds(trimmed),
      parentId,
    });
  }, [replyContent, isArchived, createMutation]);

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
    setReplyingToId(comment.id);
    setReplyContent(getReplyAuthorMention(comment));
  }, []);

  const handleReplyCancel = useCallback(() => {
    setReplyingToId(null);
    setReplyContent("");
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  useEffect(() => {
    const commentId = window.location.hash.replace("#comment-", "");
    if (!commentId || window.location.hash === "#") return;
    document.getElementById(`comment-${commentId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [commentTree]);
  const currentUserName = user?.fullName || user?.email || "Current user";
  const renderCurrentUserAvatar = (className = "w-8 h-8") => (
    <div className={`${className} rounded-full flex items-center justify-center text-[0.6875rem] font-bold shrink-0 overflow-hidden ${user?.avatar ? "" : "bg-[#2563EB] dark:bg-[#3B82F6] text-white"}`}>
      {user?.avatar ? (
        <img src={user.avatar} alt={currentUserName} className="w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user ? getAuthorInitials(user as any) : "U"
      )}
    </div>
  );

  const renderCommentNode = (node: CommentNode, depth: number = 0) => {
    const authorName = node.author?.fullName || node.author?.email || "Unknown";
    const initials = getAuthorInitials(node.author);
    const isEditing = editingId === node.id;
    const isOwnComment = Boolean(
      currentUserId && (node.authorId === currentUserId || node.author?.id === currentUserId)
    );

    const visualDepth = Math.min(depth, 3);

    return (
      <div id={`comment-${node.id}`} key={node.id} className="mt-4 scroll-mt-6">
        <div className="flex gap-4" style={{ marginLeft: `${visualDepth * 1.5}rem` }}>
          <div className="w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0 overflow-hidden">
            {node.author?.avatar ? (
              <img src={node.author.avatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">{authorName}</span>
              <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                {formatDateTime(node.createdAt)}
              </span>
              {node.editedAt && <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">(edited)</span>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <div className="border border-[#2563EB] rounded-[6px] px-2 py-1.5 text-[0.8125rem] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7]">
                  <MentionsInput
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave();
                      }
                      if (e.key === "Escape") handleEditCancel();
                    }}
                    placeholder="Edit comment... (@ to mention)"
                    className="tc-m w-full bg-transparent text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem]"
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
                          <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0">
                            {suggestion.display?.toString().charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">
                            {highlightedDisplay}
                          </span>
                        </div>
                      )}
                      className="text-[#2563EB] bg-[#EFF6FF] dark:text-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)]"
                      displayTransform={(id, display) => `@${display}`}
                    />
                  </MentionsInput>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditSave}
                    disabled={editMutation.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[0.6875rem] font-medium rounded-[4px] transition-colors disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {editMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] text-[0.6875rem] font-medium rounded-[4px] transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] whitespace-pre-wrap leading-relaxed">
                  {renderRichText(node.content)}
                </p>
                <div className="flex gap-3 mt-2 text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                  {!isArchived && (
                    <button
                      className="inline-flex items-center gap-1 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                      onClick={() => handleReplyStart(node)}
                    >
                      Reply
                    </button>
                  )}
                  {!isArchived && isOwnComment && (
                    <>
                      <button
                        onClick={() => handleEditStart(node)}
                        className="inline-flex items-center gap-1 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(node.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1 hover:text-[#9F2F2D] dark:hover:text-[#F87171] transition-colors disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
                {replyingToId === node.id && (
                  <div className="mt-3 flex gap-3 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-[#F9F9F8] dark:bg-[#252525] p-3">
                    {renderCurrentUserAvatar("w-7 h-7")}
                    <div className="min-w-0 flex-1">
                      <MentionsInput
                        autoFocus
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReplySubmit(node.id);
                          }
                          if (e.key === "Escape") handleReplyCancel();
                        }}
                        placeholder={`Reply to ${authorName}... (@ to mention)`}
                        className="tc-m w-full bg-transparent text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem]"
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
                              <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0">
                                {suggestion.display?.toString().charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">
                                {highlightedDisplay}
                              </span>
                            </div>
                          )}
                          className="text-[#2563EB] bg-[#EFF6FF] dark:text-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)]"
                          displayTransform={(id, display) => `@${display}`}
                        />
                      </MentionsInput>
                      {replyContent && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleReplySubmit(node.id)}
                            disabled={createMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[0.6875rem] font-medium rounded-[4px] transition-colors disabled:opacity-60"
                          >
                            {createMutation.isPending && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            Reply
                          </button>
                          <button
                            onClick={handleReplyCancel}
                            className="px-2.5 py-1 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#111111] dark:text-[#E8E8E7] text-[0.6875rem] font-medium rounded-[4px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-2">{node.children.map((child) => renderCommentNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (isDeleted) return null;

  if (isLoadingComments && sortedComments.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-[6px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-[0.8125rem] text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[rgba(127,29,29,0.18)] dark:text-[#FCA5A5]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="rounded-[4px] p-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss comment error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {!isArchived && (
        <>
          <div className="flex gap-4 pt-2">
            {renderCurrentUserAvatar()}
            <div className="flex-1 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[rgba(255,255,255,0.04)] focus-within:bg-white dark:focus-within:bg-[#202020] focus-within:border-[#2563EB] transition-colors p-4 cursor-text relative">
              <div className="mb-4 text-[0.8125rem] relative z-50">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                    .tc-m__control{min-height:36px}
                    .tc-m__input{width:100%;outline:none;border:none;background:transparent;color:inherit;font-family:inherit;font-size:inherit}
                    .tc-m__suggestions__list{background:#F9F9F8;border:1px solid #EAEAEA;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;z-index:100;position:absolute;min-width:200px;margin-top:4px}
                    .tc-m__suggestions__item{padding:8px 12px;cursor:pointer;color:#111111;font-size:13px}
                    .tc-m__suggestions__item--focused{background:#F0F0EE}

                    .dark .tc-m__suggestions__list{background:#252525;border-color:rgba(255,255,255,0.1)}
                    .dark .tc-m__suggestions__item{color:#E8E8E7}
                    .dark .tc-m__suggestions__item--focused{background:#2A2A2A}
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
                  className="tc-m w-full bg-transparent text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem]"
                  a11ySuggestionsListLabel="Suggested mentions"
                >
                  <Mention
                    trigger="@"
                    data={mentionMembers}
                    markup="[@__display__](__id__)"
                    renderSuggestion={(suggestion, _search, highlightedDisplay) => (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0">
                          {suggestion.display?.toString().charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">
                          {highlightedDisplay}
                        </span>
                      </div>
                    )}
                    className="text-[#2563EB] bg-[#EFF6FF] dark:text-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)]"
                    displayTransform={(id, display) => `@${display}`}
                  />
                </MentionsInput>
              </div>

              {!commentInput && (
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => setCommentInput("Who is working on this...?")}
                    className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] cursor-pointer bg-[#F9F9F8] dark:bg-[#252525] px-3 py-1.5 rounded-[4px] transition-colors"
                  >
                    Who is working on this...?
                  </span>
                  <span
                    onClick={() => setCommentInput("Status update...")}
                    className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] cursor-pointer bg-[#F9F9F8] dark:bg-[#252525] px-3 py-1.5 rounded-[4px] transition-colors"
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[0.6875rem] font-medium rounded-[4px] transition-colors disabled:opacity-60"
                  >
                    {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save
                  </button>
                  <button
                    onClick={() => setCommentInput("")}
                    className="px-3 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#111111] dark:text-[#E8E8E7] text-[0.6875rem] font-medium rounded-[4px] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-[#EAEAEA] dark:border-white/[0.06] pt-3">
                <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                  Pro tip: press{" "}
                  <span className="font-bold bg-[#F9F9F8] dark:bg-[#252525] px-1.5 py-0.5 rounded-[4px] border border-[#EAEAEA] dark:border-white/[0.08]">
                    Enter
                  </span>{" "}
                  to comment
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {commentTree.length > 0 ? (
        <div className="space-y-2 mt-2">{commentTree.map((node) => renderCommentNode(node, 0))}</div>
      ) : (
        !isLoadingComments && (
          <div className="rounded-[6px] border border-dashed border-[#EAEAEA] dark:border-white/[0.08] px-4 py-5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            No comments yet.
          </div>
        )
      )}
    </div>
  );
}
