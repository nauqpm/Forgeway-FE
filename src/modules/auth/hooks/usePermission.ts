'use client';

// =============================================================================
// usePermission HOOK — RBAC permission checking
// =============================================================================

import { useCallback } from 'react';
import { usePermissionStore } from '../stores/permissionStore';
import { useAuthStore } from '../stores/authStore';
import {
  getMyPermissionsAPI,
  getPermissionsBySpaceAPI,
} from '../services/permissionService';
import type { SpaceRoleName } from '../types/auth.types';

export const usePermission = () => {
  const { user } = useAuthStore();
  const {
    currentSpaceId,
    setCurrentSpaceId,
    setGlobalPermissions,
    setPermissionsForSpace,
    can: canCheck,
    hasSpaceRole,
  } = usePermissionStore();

  // ─── Load Global Permissions ───────────────────────────────────────────────

  const loadPermissions = useCallback(async () => {
    try {
      const { permissions } = await getMyPermissionsAPI();
      setGlobalPermissions(permissions);
      return permissions;
    } catch {
      return [];
    }
  }, [setGlobalPermissions]);

  // ─── Load Space Permissions ────────────────────────────────────────────────

  const loadSpacePermissions = useCallback(
    async (spaceId: string) => {
      try {
        const data = await getPermissionsBySpaceAPI(spaceId);
        setPermissionsForSpace(spaceId, data);
        return data;
      } catch {
        return null;
      }
    },
    [setPermissionsForSpace],
  );

  // ─── Permission Checks ────────────────────────────────────────────────────

  const can = useCallback(
    (resource: string, action: string, spaceId?: string) => {
      // Global admin bypass
      if (user?.role === 'admin') return true;
      return canCheck(resource, action, spaceId);
    },
    [user, canCheck],
  );

  const canAny = useCallback(
    (permissions: Array<{ resource: string; action: string }>, spaceId?: string) => {
      if (user?.role === 'admin') return true;
      return permissions.some((p) => canCheck(p.resource, p.action, spaceId));
    },
    [user, canCheck],
  );

  const canAll = useCallback(
    (permissions: Array<{ resource: string; action: string }>, spaceId?: string) => {
      if (user?.role === 'admin') return true;
      return permissions.every((p) => canCheck(p.resource, p.action, spaceId));
    },
    [user, canCheck],
  );

  const hasRole = useCallback(
    (role: SpaceRoleName, spaceId?: string) => {
      const targetSpace = spaceId ?? currentSpaceId;
      if (!targetSpace) return false;
      return hasSpaceRole(targetSpace, role);
    },
    [currentSpaceId, hasSpaceRole],
  );

  // ─── Set Current Space Context ─────────────────────────────────────────────

  const setCurrentSpace = useCallback(
    async (spaceId: string) => {
      setCurrentSpaceId(spaceId);
      await loadSpacePermissions(spaceId);
    },
    [setCurrentSpaceId, loadSpacePermissions],
  );

  return {
    currentSpaceId,
    loadPermissions,
    loadSpacePermissions,
    can,
    canAny,
    canAll,
    hasRole,
    setCurrentSpace,
  };
};