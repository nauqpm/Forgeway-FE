'use client';

import { useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

type AvatarSyncable = { _id?: string; id?: string; avatar?: string | null };

/**
 * Returns a derived workspace list with avatars merged from the global store.
 *
 * Uses useMemo — no state updates, no extra renders. Handles both:
 * - Initial API load (local populates after store is already up-to-date)
 * - Real-time socket updates (store changes after local is stable)
 */
export function useWorkspaceAvatarSync<T extends AvatarSyncable>(localWorkspaces: T[]): T[] {
  const storeWorkspaces = useWorkspaceStore((state) => state.workspaces);

  return useMemo(() => {
    if (storeWorkspaces.length === 0 || localWorkspaces.length === 0) return localWorkspaces;

    let anyChanged = false;
    const next = localWorkspaces.map((local) => {
      const id = local._id ?? local.id;
      if (!id) return local;
      const sw = storeWorkspaces.find((s) => s._id === id);
      if (!sw) return local;
      const storeAvatar = sw.avatar ?? null;
      // Only override local avatar when the store actually has a real value —
      // avoids clobbering a correct API-fetched avatar with a stale null from
      // a socket event that arrived before avatar was persisted.
      if (!storeAvatar) return local;
      if (local.avatar === storeAvatar) return local;
      anyChanged = true;
      return { ...local, avatar: storeAvatar };
    });

    return anyChanged ? next : localWorkspaces;
  }, [localWorkspaces, storeWorkspaces]);
}
