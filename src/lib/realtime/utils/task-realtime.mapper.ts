import type { Issue } from '@/modules/workspace/shared/types/issue.type';

export type TaskSummaryPayload = {
  id: string;
  _id?: string;
  key: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  columnId?: string;
  sprintId?: string | null;
  rank?: string;
  version?: number;
  assigneeId?: string | null;
  reporterId?: string;
  storyPoints?: number;
  isArchived?: boolean;
  isDeleted?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

const normalizeLabel = (value?: string, fallback = '') => {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizeStatus = (value?: string) => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, '');
  const labels: Record<string, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    'in-progress': 'In Progress',
    testing: 'Testing',
    done: 'Done',
  };

  return labels[normalized ?? ''] ?? value ?? 'To Do';
};

export const mapTaskSummaryToIssue = (
  task?: TaskSummaryPayload,
): Issue | undefined => {
  if (!task?.id || !task.key) return undefined;

  return {
    id: task.id,
    _id: task._id,
    key: task.key,
    title: task.title,
    description: task.description ?? '',
    columnId: task.columnId ?? task.status ?? 'todo',
    status: normalizeStatus(task.status ?? task.columnId),
    rank: task.rank,
    priority: normalizeLabel(task.priority, 'Medium'),
    type: normalizeLabel(task.type, 'Task'),
    assignee: task.assigneeId ?? 'U',
    assigneeId: task.assigneeId ?? undefined,
    color: 'bg-indigo-600',
    sprintId: task.sprintId ?? null,
    storyPoints: task.storyPoints ?? 0,
    isArchived: task.isArchived,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    version: task.version,
  };
};