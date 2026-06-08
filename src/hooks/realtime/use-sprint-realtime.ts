'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { SPRINT_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Sprint } from '@/modules/client/workspaces/types/sprint.type';

type SprintSummaryPayload = Partial<Sprint> & {
  id?: string;
  _id?: string;
  workspaceId: string;
  name: string;
  status: Sprint['status'];
};

type SprintCreatedEventData = {
  workspaceId: string;
  sprintId: string;
  actorId?: string;
  version?: number;
  sprint?: SprintSummaryPayload;
};

type SprintRealtimeEnvelope = RealtimeEnvelope<SprintCreatedEventData>;

type UseSprintRealtimeOptions = {
  onSprintCreated?: (sprint: Sprint) => void;
};

const mapSprintPayload = (payload?: SprintSummaryPayload): Sprint | null => {
  if (!payload) return null;

  const id = payload.id ?? payload._id;
  if (!id || !payload.workspaceId || !payload.name || !payload.status) {
    return null;
  }

  return {
    ...payload,
    id,
    _id: id,
    workspaceId: payload.workspaceId,
    name: payload.name,
    status: payload.status,
  };
};

const isSameSprint = (a: Sprint, b: Sprint): boolean => {
  const aId = a.id ?? a._id;
  const bId = b.id ?? b._id;
  return Boolean(aId && bId && aId === bId);
};

const upsertSprint = (
  current: Sprint[] | undefined,
  sprint: Sprint,
): Sprint[] => {
  const sprints = current ?? [];
  const exists = sprints.some((item) => isSameSprint(item, sprint));

  if (exists) {
    return sprints.map((item) =>
      isSameSprint(item, sprint) ? { ...item, ...sprint } : item,
    );
  }

  return [...sprints, sprint];
};

export function useSprintRealtime(
  workspaceId?: string,
  options: UseSprintRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { onSprintCreated } = options;

  useEffect(() => {
    if (!workspaceId) return;

    const socket = realtimeSocketClient.getSocket();
    if (!socket) return;

    const handleSprintCreated = (envelope: SprintRealtimeEnvelope) => {
      if (
        envelope.workspaceId !== workspaceId &&
        envelope.data.workspaceId !== workspaceId
      ) {
        return;
      }

      const actorId = envelope.actorId ?? envelope.data.actorId;
      if (actorId && actorId === currentUserId) {
        return;
      }

      const sprint = mapSprintPayload(envelope.data.sprint);
      if (!sprint) return;

      queryClient.setQueryData<Sprint[]>(
        ['sprints', workspaceId],
        (current) => upsertSprint(current, sprint),
      );
      onSprintCreated?.(sprint);
    };

    const unsubscribeReconnect = realtimeSocketClient.onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ['sprints', workspaceId] });
    });

    socket.on(SPRINT_EVENTS.CREATED, handleSprintCreated);

    return () => {
      socket.off(SPRINT_EVENTS.CREATED, handleSprintCreated);
      unsubscribeReconnect();
    };
  }, [currentUserId, onSprintCreated, queryClient, workspaceId]);
}
