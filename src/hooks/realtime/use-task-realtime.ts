'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { TASK_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Issue } from '@/modules/client/workspaces/types/issue.type';

type TaskSummaryPayload = {
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

type TaskEventContext = {
  workspaceId: string;
  taskId: string;
  taskKey: string;
  actorId?: string;
  version?: number;
};

type TaskEventData = TaskEventContext & {
  task?: TaskSummaryPayload;
};

type TaskRealtimeEnvelope = RealtimeEnvelope<TaskEventData>;

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

const taskIdOf = (issue: Issue) => issue.id || issue._id;

const compareRank = (a?: string, b?: string) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
};

const sortIssuesByRank = (issues: Issue[]) => {
  return [...issues].sort((a, b) => {
    if (a.columnId !== b.columnId) return 0;
    const rankCompare = compareRank(a.rank, b.rank);
    if (rankCompare !== 0) return rankCompare;
    return a.key.localeCompare(b.key);
  });
};

const toIssue = (task?: TaskSummaryPayload): Issue | undefined => {
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

const shouldApplyEvent = (
  currentIssue: Issue | undefined,
  incomingVersion: number | undefined,
  actorId: string | undefined,
  currentUserId: string | undefined,
) => {
  if (!currentIssue || !incomingVersion || !currentIssue.version) {
    return { apply: true, refetch: false };
  }

  if (incomingVersion > currentIssue.version) {
    return { apply: true, refetch: false };
  }

  if (incomingVersion === currentIssue.version) {
    const ownEvent = actorId === currentUserId;
    if (ownEvent) return { apply: false, refetch: false };
    return { apply: false, refetch: true };
  }

  return { apply: false, refetch: false };
};

const upsertTask = (
  current: Issue[] | undefined,
  issue: Issue,
) => {
  const list = current ?? [];
  const existing = list.find((item) => taskIdOf(item) === issue.id);
  const next = existing
    ? list.map((item) => (taskIdOf(item) === issue.id ? { ...item, ...issue } : item))
    : [issue, ...list];

  return sortIssuesByRank(next);
};

const removeTask = (
  current: Issue[] | undefined,
  taskId: string | undefined,
) => {
  if (!taskId) return current;
  return (current ?? []).filter((issue) => taskIdOf(issue) !== taskId);
};

const findTaskInCache = (
  cachedQueries: Array<[unknown, Issue[] | undefined]>,
  taskId?: string,
) => {
  if (!taskId) return undefined;

  return cachedQueries
    .flatMap(([, data]) => data ?? [])
    .find((issue) => taskIdOf(issue) === taskId);
};

export function useTaskRealtime(workspaceId?: string) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const applyTaskEnvelope = (envelope: TaskRealtimeEnvelope) => {
      if (envelope.workspaceId !== workspaceId && envelope.data.workspaceId !== workspaceId) {
        return;
      }

      const eventTaskId = envelope.data.taskId ?? envelope.data.task?.id;
      const incomingVersion = envelope.version ?? envelope.data.version ?? envelope.data.task?.version;
      const actorId = envelope.actorId ?? envelope.data.actorId;

      if (envelope.type === TASK_EVENTS.ARCHIVED || envelope.type === TASK_EVENTS.DELETED) {
        queryClient.setQueriesData<Issue[]>(
          { queryKey: ['tasks', workspaceId] },
          (current) => removeTask(current, eventTaskId),
        );
        queryClient.removeQueries({
          queryKey: ['taskDetail', workspaceId, envelope.data.taskKey],
          exact: true,
        });
        return;
      }

      const issue = toIssue(envelope.data.task);
      if (!issue) return;

      const cachedTasks = queryClient.getQueriesData<Issue[]>({
        queryKey: ['tasks', workspaceId],
      });
      const existing = findTaskInCache(cachedTasks, eventTaskId ?? issue.id);
      const decision = shouldApplyEvent(
        existing,
        incomingVersion,
        actorId,
        currentUserId,
      );

      if (decision.refetch) {
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
        return;
      }

      if (!decision.apply) return;

      queryClient.setQueriesData<Issue[]>(
        { queryKey: ['tasks', workspaceId] },
        (current) => upsertTask(current, issue),
      );
    };

    socket.on(TASK_EVENTS.CREATED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.UPDATED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.MOVED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.REORDERED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.ARCHIVED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.RESTORED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.DELETED, applyTaskEnvelope);

    return () => {
      socket.off(TASK_EVENTS.CREATED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.UPDATED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.MOVED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.REORDERED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.ARCHIVED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.RESTORED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.DELETED, applyTaskEnvelope);
    };
  }, [currentUserId, queryClient, workspaceId]);
}