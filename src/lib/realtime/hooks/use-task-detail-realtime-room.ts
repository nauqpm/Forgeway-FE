'use client';

import { useEffect } from 'react';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { SOCKET_EVENTS } from '@/lib/socket/socket.events';

interface UseTaskDetailRealtimeRoomOptions {
  workspaceId?: string;
  taskId?: string;
  enabled?: boolean;
}

export function useTaskDetailRealtimeRoom({
  workspaceId,
  taskId,
  enabled = true,
}: UseTaskDetailRealtimeRoomOptions) {
  useEffect(() => {
    if (!enabled || !workspaceId || !taskId) return;

    realtimeSocketClient.connect();

    const payload = { workspaceId, taskId };

    const joinRoom = () => {
      const socket = realtimeSocketClient.getSocket();
      if (!socket?.connected) return;
      socket.emit(SOCKET_EVENTS.TASK_JOIN, payload);
    };

    joinRoom();
    const unsubscribeStatus = realtimeSocketClient.subscribeStatus((snapshot) => {
      if (snapshot.status === 'connected') joinRoom();
    });

    return () => {
      const socket = realtimeSocketClient.getSocket();
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.TASK_LEAVE, payload);
      }
      unsubscribeStatus();
    };
  }, [enabled, taskId, workspaceId]);
}
