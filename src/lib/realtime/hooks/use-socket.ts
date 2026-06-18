'use client';

import { useEffect, useState } from 'react';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import type { RealtimeStatusSnapshot } from '@/lib/socket/socket.types';

export function useSocket() {
  const [snapshot, setSnapshot] = useState<RealtimeStatusSnapshot>(() =>
    realtimeSocketClient.getStatusSnapshot(),
  );

  useEffect(() => {
    const unsubscribe = realtimeSocketClient.subscribeStatus(setSnapshot);
    realtimeSocketClient.connect();

    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    socket: realtimeSocketClient.getSocket(),
    connect: () => realtimeSocketClient.connect(),
    disconnect: () => realtimeSocketClient.disconnect(),
    switchWorkspace: (workspaceId?: string) =>
      realtimeSocketClient.switchWorkspace(workspaceId),
  };
}