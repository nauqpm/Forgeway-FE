import { create } from 'zustand';
import type { Permission, SpacePermissions, SpaceRoleName } from '../types/auth.types';

// ─── Permission Store ────────────────────────────────────────────────────────
// RBAC enforced per Space. Stores permissions keyed by spaceId.

interface PermissionState {
  currentSpaceId: string | null;
  /** Global permissions (not space-scoped) */
  globalPermissions: Permission[];
  /** Permissions indexed by spaceId */
  permissionsBySpace: Record<string, SpacePermissions>;
}

interface PermissionActions {
  setCurrentSpaceId: (spaceId: string | null) => void;
  setGlobalPermissions: (permissions: Permission[]) => void;
  setPermissionsForSpace: (spaceId: string, data: SpacePermissions) => void;
  /** Check if user can perform action on resource, optionally within a space */
  can: (resource: string, action: string, spaceId?: string) => boolean;
  /** Check if user has specific role in a space */
  hasSpaceRole: (spaceId: string, role: SpaceRoleName) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState & PermissionActions>(
  (set, get) => ({
    // ── State ──
    currentSpaceId: null,
    globalPermissions: [],
    permissionsBySpace: {},

    // ── Actions ──
    setCurrentSpaceId: (currentSpaceId) =>
      set({ currentSpaceId }),

    setGlobalPermissions: (globalPermissions) =>
      set({ globalPermissions }),

    setPermissionsForSpace: (spaceId, data) =>
      set((state) => ({
        permissionsBySpace: {
          ...state.permissionsBySpace,
          [spaceId]: data,
        },
      })),

    can: (resource, action, spaceId) => {
      const state = get();
      const targetSpaceId = spaceId ?? state.currentSpaceId;

      // Check global permissions first
      const hasGlobal = state.globalPermissions.some(
        (p) => p.resource === resource && p.action === action,
      );
      if (hasGlobal) return true;

      // Check space-scoped permissions
      if (targetSpaceId) {
        const spacePerms = state.permissionsBySpace[targetSpaceId];
        if (spacePerms) {
          // Space owners and admins have all permissions
          if (spacePerms.role === 'owner' || spacePerms.role === 'admin') {
            return true;
          }
          return spacePerms.permissions.some(
            (p) => p.resource === resource && p.action === action,
          );
        }
      }

      return false;
    },

    hasSpaceRole: (spaceId, role) => {
      const spacePerms = get().permissionsBySpace[spaceId];
      return spacePerms?.role === role;
    },

    clearPermissions: () =>
      set({
        currentSpaceId: null,
        globalPermissions: [],
        permissionsBySpace: {},
      }),
  }),
);