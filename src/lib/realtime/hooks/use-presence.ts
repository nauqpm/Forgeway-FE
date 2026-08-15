import { useCallback, useEffect } from 'react';
import { usePresenceStore } from '@/stores/presenceStore';
import { presenceClient } from '../presence.client';

export function usePresence(userId?: string) {
  const presence = usePresenceStore(
    useCallback(state => (userId ? (state.users[userId] ?? null) : null), [userId]),
  );

  useEffect(() => {
    if (!userId) return;

    presenceClient.subscribe([userId]);

    return () => {
      presenceClient.unsubscribe([userId]);
    };
  }, [userId]);

  return presence;
}

export function useBatchPresence(userIds: string[]) {
  const sortedKey = [...userIds].sort().join(',');

  const presence = usePresenceStore(
    useCallback(
      state => userIds.map(id => state.users[id] ?? null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [sortedKey],
    ),
  );

  useEffect(() => {
    if (!userIds || userIds.length === 0) return;

    presenceClient.subscribe(userIds);

    return () => {
      presenceClient.unsubscribe(userIds);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedKey]);

  return presence;
}
