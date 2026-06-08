'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { SPRINT_EVENTS } from '@/lib/socket/socket.events';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import type { Sprint } from '@/modules/client/workspaces/types/sprint.type';
import {
  mapSprintPayload,
  upsertSprint,
  type SprintRealtimeEnvelope,
} from './sprint-realtime-cache.utils';

type UseSprintRealtimeOptions = {
  onSprintCreated?: (sprint: Sprint) => void;
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
