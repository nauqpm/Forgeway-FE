import { create } from 'zustand';
import type { Permission } from '../types/auth.types';

interface PermissionState {
  globalPermissions: Permission[];
}

interface PermissionActions {
  setGlobalPermissions: (permissions: Permission[]) => void;
  can: (resource: string, action: string) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState & PermissionActions>(
  (set, get) => ({
    globalPermissions: [],

    setGlobalPermissions: (globalPermissions) =>
      set({ globalPermissions }),

    can: (resource, action) => {
      const state = get();
      return state.globalPermissions.some(
        (p) => p.resource === resource && p.action === action,
      );
    },

    clearPermissions: () =>
      set({
        globalPermissions: [],
      }),
  }),
);
