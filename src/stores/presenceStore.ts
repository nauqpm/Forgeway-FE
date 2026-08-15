import { create } from 'zustand';

export interface PresenceEntry {
  status: 'online' | 'offline';
  lastSeenAt: string | null;
  invisible?: boolean;
}

interface PresenceState {
  users: Record<string, PresenceEntry>;
  upsert: (userId: string, entry: PresenceEntry) => void;
  upsertBatch: (entries: Record<string, PresenceEntry>) => void;
  remove: (userId: string) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: {},
  upsert: (userId, entry) =>
    set((state) => ({
      users: { ...state.users, [userId]: entry },
    })),
  upsertBatch: (entries) =>
    set((state) => ({
      users: { ...state.users, ...entries },
    })),
  remove: (userId) =>
    set((state) => {
      const newUsers = { ...state.users };
      delete newUsers[userId];
      return { users: newUsers };
    }),
}));
