import type {
  PaginatedActivitiesResponse,
  TaskActivity,
  TaskComment,
} from '@/modules/workspace/shared/services/taskService';
import {
  normalizeTaskAttachment,
  type RawTaskAttachment,
  type TaskAttachment,
} from '@/modules/workspace/shared/types/attachment.type';
import type { TaskCover } from '@/modules/workspace/shared/types/task-cover.type';
import type { TaskDetailResponse } from '@/modules/workspace/shared/types/task-detail.type';

const commentIdOf = (comment: Pick<TaskComment, 'id' | '_id'>) =>
  comment.id || comment._id;

const sameOptimisticComment = (a: TaskComment, b: TaskComment) =>
  a.id?.startsWith('optimistic-') &&
  a.content === b.content &&
  a.authorId === b.authorId &&
  (a.parentId ?? null) === (b.parentId ?? null);

export const upsertComment = (
  current: TaskComment[] | undefined,
  comment: TaskComment,
): TaskComment[] => {
  const list = current ?? [];
  const id = commentIdOf(comment);
  const withoutDuplicateOptimistic = list.filter(
    (item) => commentIdOf(item) !== id && !sameOptimisticComment(item, comment),
  );

  return [...withoutDuplicateOptimistic, comment].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

export const removeComment = (
  current: TaskComment[] | undefined,
  commentId?: string,
): TaskComment[] | undefined => {
  if (!commentId) return current;
  return (current ?? []).filter((comment) => commentIdOf(comment) !== commentId);
};

export const upsertAttachment = (
  current: TaskAttachment[] | undefined,
  attachment: RawTaskAttachment,
): TaskAttachment[] => {
  const list = current ?? [];
  const normalizedAttachment = normalizeTaskAttachment(attachment);
  const next = list.some((item) => item.id === normalizedAttachment.id)
    ? list.map((item) =>
        item.id === normalizedAttachment.id ? { ...item, ...normalizedAttachment } : item,
      )
    : [normalizedAttachment, ...list];

  return next.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const removeAttachment = (
  current: TaskAttachment[] | undefined,
  attachmentId?: string,
): TaskAttachment[] | undefined => {
  if (!attachmentId) return current;
  return (current ?? []).filter((attachment) => attachment.id !== attachmentId);
};

export const prependActivity = (
  current: PaginatedActivitiesResponse | undefined,
  activity: TaskActivity,
): PaginatedActivitiesResponse => {
  const base = current ?? {
    activities: [],
    total: 0,
    page: 1,
    limit: 20,
  };
  const withoutDuplicate = base.activities.filter((item) => item.id !== activity.id);

  return {
    ...base,
    activities: [activity, ...withoutDuplicate],
    total: Math.max(base.total, withoutDuplicate.length + 1),
  };
};

export const updateTaskLabels = (
  current: TaskDetailResponse | undefined,
  labelIds: string[],
  task?: Partial<TaskDetailResponse>,
): TaskDetailResponse | undefined => {
  if (!current && !task?.id) return current;
  return {
    ...(current ?? (task as TaskDetailResponse)),
    ...(task ?? {}),
    labelIds,
  } as TaskDetailResponse;
};

export const updateTaskCover = (
  current: TaskDetailResponse | undefined,
  cover: TaskCover | null,
): TaskDetailResponse | undefined => {
  if (!current) return current;
  return {
    ...current,
    cover,
  };
};
