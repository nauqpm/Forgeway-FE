import { create } from 'zustand';
import type { Permission } from '../types/permisson.types';

interface PermissionState {
  globalPermissions: Permission[];
}

interface PermissionActions {
  setGlobalPermissions: (permissions: Permission[]) => void;
  can: (resource: string, action: string) => boolean;
  clearPermissions: () => void;
}

/**
 * Check if a permission matches a resource/action pair.
 * Supports wildcard (*) for both resource and action.
 */
function matchesPermission(
  permission: Permission,
  resource: string,
  action: string
): boolean {
  const resourceMatches = permission.resource === resource || permission.resource === '*';
  const actionMatches = permission.action === action || permission.action === '*';
  return resourceMatches && actionMatches;
}

export const usePermissionStore = create<PermissionState & PermissionActions>(
  (set, get) => ({
    globalPermissions: [],

    setGlobalPermissions: (globalPermissions) =>
      set({ globalPermissions }),

    can: (resource, action) => {
      const state = get();
      return state.globalPermissions.some((p) =>
        matchesPermission(p, resource, action)
      );
    },

    clearPermissions: () =>
      set({
        globalPermissions: [],
      }),
  }),
);
