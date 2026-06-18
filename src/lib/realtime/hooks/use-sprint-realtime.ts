'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { SPRINT_EVENTS } from '@/lib/socket/socket.events';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { queryKeys } from '@/shared/constants/queryKeys';
import type { Sprint } from '@/modules/workspace/shared/types/sprint.type';
import {
  isActiveSprint,
  mapSprintPayload,
  removeSprint,
  sprintIdOf,
  upsertSprint,
  type SprintRealtimeEnvelope,
} from '../utils/sprint-realtime-cache.utils';

type UseSprintRealtimeOptions = {
  onSprintCreated?: (sprint: Sprint) => void;
  onSprintUpdated?: (sprint: Sprint) => void;
  onSprintDeleted?: (sprintId: string) => void;
  onSprintStarted?: (sprint: Sprint) => void;
  onSprintCompleted?: (sprint: Sprint | null, sprintId: string) => void;
};

export function useSprintRealtime(
  workspaceId?: string,
  options: UseSprintRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const {
    onSprintCreated,
    onSprintUpdated,
    onSprintDeleted,
    onSprintStarted,
    onSprintCompleted,
  } = options;

  useEffect(() => {
    if (!workspaceId) return;

    const socket = realtimeSocketClient.getSocket();
    if (!socket) return;

    const isWorkspaceEvent = (envelope: SprintRealtimeEnvelope) =>
      envelope.workspaceId === workspaceId ||
      envelope.data.workspaceId === workspaceId;

    const sprintFromEnvelope = (envelope: SprintRealtimeEnvelope) =>
      mapSprintPayload(envelope.data.sprint);

    const upsertSprintCache = (sprint: Sprint) => {
      queryClient.setQueryData<Sprint[]>(
        queryKeys.sprints.byWorkspace(workspaceId),
        (current) => upsertSprint(current, sprint),
      );
    };

    const invalidateBoardTasks = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board.byWorkspace(workspaceId) });
    };

    const handleSprintCreated = (envelope: SprintRealtimeEnvelope) => {
      if (!isWorkspaceEvent(envelope)) return;

      const actorId = envelope.actorId ?? envelope.data.actorId;
      if (actorId && actorId === currentUserId) {
        return;
      }

      const sprint = sprintFromEnvelope(envelope);
      if (!sprint) return;

      upsertSprintCache(sprint);
      onSprintCreated?.(sprint);
    };

    const handleSprintUpdated = (envelope: SprintRealtimeEnvelope) => {
      if (!isWorkspaceEvent(envelope)) return;

      const sprint = sprintFromEnvelope(envelope);
      if (!sprint) return;

      upsertSprintCache(sprint);
      onSprintUpdated?.(sprint);
    };

    const handleSprintStarted = (envelope: SprintRealtimeEnvelope) => {
      if (!isWorkspaceEvent(envelope)) return;

      const sprint = sprintFromEnvelope(envelope);
      if (!sprint) return;

      upsertSprintCache(sprint);
      onSprintStarted?.(sprint);
      invalidateBoardTasks();
    };

    const handleSprintCompleted = (envelope: SprintRealtimeEnvelope) => {
      if (
        envelope.workspaceId !== workspaceId &&
        envelope.data.workspaceId !== workspaceId
      ) {
        return;
      }

      const sprint = sprintFromEnvelope(envelope);
      const sprintId = sprint ? sprintIdOf(sprint) : envelope.data.sprintId;

      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
      invalidateBoardTasks();
      onSprintCompleted?.(sprint, sprintId);
    };

    const handleSprintDeleted = (envelope: SprintRealtimeEnvelope) => {
      if (!isWorkspaceEvent(envelope)) return;

      const sprint = sprintFromEnvelope(envelope);
      const sprintId = sprint ? sprintIdOf(sprint) : envelope.data.sprintId;
      const cachedSprints =
        queryClient.getQueryData<Sprint[]>(queryKeys.sprints.byWorkspace(workspaceId)) ?? [];
      const wasActive =
        sprint?.status === 'active' || isActiveSprint(cachedSprints, sprintId);

      queryClient.setQueryData<Sprint[]>(
        queryKeys.sprints.byWorkspace(workspaceId),
        (current) => removeSprint(current, sprintId),
      );
      onSprintDeleted?.(sprintId);

      if (wasActive) {
        invalidateBoardTasks();
      }
    };

    const unsubscribeReconnect = realtimeSocketClient.onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
    });

    socket.on(SPRINT_EVENTS.CREATED, handleSprintCreated);
    socket.on(SPRINT_EVENTS.UPDATED, handleSprintUpdated);
    socket.on(SPRINT_EVENTS.DELETED, handleSprintDeleted);
    socket.on(SPRINT_EVENTS.STARTED, handleSprintStarted);
    socket.on(SPRINT_EVENTS.COMPLETED, handleSprintCompleted);

    return () => {
      socket.off(SPRINT_EVENTS.CREATED, handleSprintCreated);
      socket.off(SPRINT_EVENTS.UPDATED, handleSprintUpdated);
      socket.off(SPRINT_EVENTS.DELETED, handleSprintDeleted);
      socket.off(SPRINT_EVENTS.STARTED, handleSprintStarted);
      socket.off(SPRINT_EVENTS.COMPLETED, handleSprintCompleted);
      unsubscribeReconnect();
    };
  }, [
    currentUserId,
    onSprintCompleted,
    onSprintCreated,
    onSprintDeleted,
    onSprintStarted,
    onSprintUpdated,
    queryClient,
    workspaceId,
  ]);
}
