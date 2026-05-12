'use client';

import { useCallback } from 'react';
import { usePermissionStore } from '../stores/permissionStore';
import { useAuthStore } from '../stores/authStore';
import { getMyPermissionsAPI } from '../services/permissionService';

export const usePermission = () => {
  const { user } = useAuthStore();
  const { setGlobalPermissions, can: canCheck } = usePermissionStore();

  const loadPermissions = useCallback(async () => {
    try {
      const { permissions } = await getMyPermissionsAPI();
      setGlobalPermissions(permissions);
      return permissions;
    } catch {
      return [];
    }
  }, [setGlobalPermissions]);

  const can = useCallback(
    (resource: string, action: string) => {
      if (user?.role === 'super_admin') return true;
      return canCheck(resource, action);
    },
    [user, canCheck],
  );

  const canAny = useCallback(
    (permissions: Array<{ resource: string; action: string }>) => {
      if (user?.role === 'super_admin') return true;
      return permissions.some((p) => canCheck(p.resource, p.action));
    },
    [user, canCheck],
  );

  const canAll = useCallback(
    (permissions: Array<{ resource: string; action: string }>) => {
      if (user?.role === 'super_admin') return true;
      return permissions.every((p) => canCheck(p.resource, p.action));
    },
    [user, canCheck],
  );

  return {
    loadPermissions,
    can,
    canAny,
    canAll,
  };
};
