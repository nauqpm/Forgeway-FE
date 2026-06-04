'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { TASK_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Issue } from '@/modules/client/workspaces/types/issue.type';
import {
  findTaskInCache,
  getAffectedTaskQueries,
  removeTask,
  shouldApplyEvent,
  upsertTask,
} from './task-realtime-cache.utils';

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

type UseTaskRealtimeOptions = {
  onTaskUpserted?: (issue: Issue) => void;
  onTaskRemoved?: (taskId: string) => void;
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

export function useTaskRealtime(
  workspaceId?: string,
  options: UseTaskRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { onTaskRemoved, onTaskUpserted } = options;

  useEffect(() => {
    if (!workspaceId) return;

    const socket = realtimeSocketClient.getSocket();
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
        if (eventTaskId) onTaskRemoved?.(eventTaskId);
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
      onTaskUpserted?.(issue);
    };

    const handleTaskReordered = (envelope: TaskRealtimeEnvelope) => {
      if (envelope.workspaceId !== workspaceId && envelope.data.workspaceId !== workspaceId) {
        return;
      }

      const issue = toIssue(envelope.data.task);
      if (!issue) return;

      const eventTaskId = envelope.data.taskId ?? envelope.data.task?.id ?? issue.id;
      const incomingVersion = envelope.version ?? envelope.data.version ?? envelope.data.task?.version;
      const actorId = envelope.actorId ?? envelope.data.actorId;
      const cachedTasks = queryClient.getQueriesData<Issue[]>({
        queryKey: ['tasks', workspaceId],
      });
      const affectedQueries = getAffectedTaskQueries(cachedTasks, eventTaskId);

      if (affectedQueries.length === 0) {
        return;
      }

      const existing = findTaskInCache(affectedQueries, eventTaskId);
      const decision = shouldApplyEvent(
        existing,
        incomingVersion,
        actorId,
        currentUserId,
      );

      if (decision.refetch) {
        affectedQueries.forEach(([queryKey]) => {
          queryClient.invalidateQueries({ queryKey, exact: true });
        });
        return;
      }

      if (!decision.apply) return;

      affectedQueries.forEach(([queryKey]) => {
        queryClient.setQueryData<Issue[]>(queryKey, (current) =>
          upsertTask(current, issue),
        );
      });
      onTaskUpserted?.(issue);
    };

    socket.on(TASK_EVENTS.CREATED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.UPDATED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.MOVED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.REORDERED, handleTaskReordered);
    socket.on(TASK_EVENTS.ARCHIVED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.RESTORED, applyTaskEnvelope);
    socket.on(TASK_EVENTS.DELETED, applyTaskEnvelope);

    return () => {
      socket.off(TASK_EVENTS.CREATED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.UPDATED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.MOVED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.REORDERED, handleTaskReordered);
      socket.off(TASK_EVENTS.ARCHIVED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.RESTORED, applyTaskEnvelope);
      socket.off(TASK_EVENTS.DELETED, applyTaskEnvelope);
    };
  }, [currentUserId, onTaskRemoved, onTaskUpserted, queryClient, workspaceId]);
}
