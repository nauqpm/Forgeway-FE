'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AUTH_PERMISSIONS_QUERY_KEY } from '../../shared/hooks/useAuth';
import { usePermissionStore } from '../stores/permissionStore';
import { useAuthStore } from '../../shared/stores/authStore';
import { getMyPermissionsAPI } from '../services/permissionService';

export const usePermission = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { setGlobalPermissions, can: canCheck } = usePermissionStore();

  useQuery({
    queryKey: AUTH_PERMISSIONS_QUERY_KEY,
    queryFn: async () => {
      const { permissions } = await getMyPermissionsAPI();
      setGlobalPermissions(permissions);
      return permissions;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const loadPermissions = useCallback(async () => {
    try {
      const permissions = await queryClient.fetchQuery({
        queryKey: AUTH_PERMISSIONS_QUERY_KEY,
        queryFn: async () => {
          const { permissions } = await getMyPermissionsAPI();
          return permissions;
        },
        retry: false,
      });
      setGlobalPermissions(permissions);
      return permissions;
    } catch {
      return [];
    }
  }, [queryClient, setGlobalPermissions]);

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
