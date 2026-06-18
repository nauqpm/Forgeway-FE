'use client';

import { useEffect } from 'react';
import { notifyManager, useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { TASK_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { queryKeys } from '@/shared/constants/queryKeys';
import type { Issue } from '@/modules/workspace/shared/types/issue.type';
import {
  findTaskInCache,
  getAffectedTaskQueries,
  hasReorderStateChanged,
  mergeReorderedTask,
  removeTask,
  shouldApplyEvent,
  shouldApplyReorderEvent,
  upsertTask,
} from '../utils/task-realtime-cache.utils';
import {
  mapTaskSummaryToIssue,
  type TaskSummaryPayload,
} from '../utils/task-realtime.mapper';

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

export function useTaskRealtime(
  workspaceId?: string,
  options: UseTaskRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { onTaskRemoved, onTaskUpserted } = options;

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
          { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
          (current) => removeTask(current, eventTaskId),
        );
        if (eventTaskId) onTaskRemoved?.(eventTaskId);
        if (envelope.data.taskKey) {
          queryClient.removeQueries({
            queryKey: queryKeys.tasks.detail(workspaceId, envelope.data.taskKey),
            exact: true,
          });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
        return;
      }

      const issue = mapTaskSummaryToIssue(envelope.data.task);
      if (!issue) return;

      const cachedTasks = queryClient.getQueriesData<Issue[]>({
        queryKey: queryKeys.tasks.byWorkspace(workspaceId),
      });
      const existing = findTaskInCache(cachedTasks, eventTaskId ?? issue.id);
      const decision = shouldApplyEvent(
        existing,
        incomingVersion,
        actorId,
        currentUserId,
      );

      if (decision.refetch) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
        return;
      }

      if (!decision.apply) return;

      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
        (current) => upsertTask(current, issue),
      );
      if (issue.key) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(workspaceId, issue.key),
          (current: Issue | undefined) => current ? { ...current, ...issue } : current
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      onTaskUpserted?.(issue);
    };

    const handleTaskReordered = (envelope: TaskRealtimeEnvelope) => {
      if (envelope.workspaceId !== workspaceId && envelope.data.workspaceId !== workspaceId) {
        return;
      }

      const issue = mapTaskSummaryToIssue(envelope.data.task);
      if (!issue) return;

      const eventTaskId = envelope.data.taskId ?? envelope.data.task?.id ?? issue.id;
      const incomingVersion = envelope.version ?? envelope.data.version ?? envelope.data.task?.version;
      const actorId = envelope.actorId ?? envelope.data.actorId;
      if (actorId && actorId === currentUserId) {
        return;
      }

      const cachedTasks = queryClient.getQueriesData<Issue[]>({
        queryKey: queryKeys.tasks.byWorkspace(workspaceId),
      });
      const affectedQueries = getAffectedTaskQueries(cachedTasks, eventTaskId);

      if (affectedQueries.length === 0) {
        return;
      }

      const existing = findTaskInCache(affectedQueries, eventTaskId);
      const decision = shouldApplyReorderEvent(
        existing,
        incomingVersion,
        actorId,
        currentUserId,
      );

      const hasStateChange = hasReorderStateChanged(existing, issue);
      let shouldApply = decision.apply;

      if (decision.refetch) {
        if (incomingVersion === existing?.version && hasStateChange) {
          shouldApply = true;
        } else {
          affectedQueries.forEach(([queryKey]) => {
            queryClient.invalidateQueries({ queryKey, exact: true });
          });
          return;
        }
      }

      if (!shouldApply) return;

      try {
        notifyManager.batch(() => {
          affectedQueries.forEach(([queryKey]) => {
            queryClient.setQueryData<Issue[]>(queryKey, (current) =>
              mergeReorderedTask(current, issue),
            );
          });
          if (issue.key) {
            queryClient.setQueryData(
              queryKeys.tasks.detail(workspaceId, issue.key),
              (current: Issue | undefined) => current ? { ...current, ...issue } : current
            );
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
          onTaskUpserted?.(issue);
        });
      } catch {
        affectedQueries.forEach(([queryKey]) => {
          queryClient.invalidateQueries({ queryKey, exact: true });
        });
      }
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

