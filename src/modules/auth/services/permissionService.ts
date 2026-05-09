// =============================================================================
// PERMISSION SERVICE — RBAC API calls
// =============================================================================

import api from '@/config/api';
import type { Permission, SpacePermissions } from '../types/auth.types';

// ─── Get My Global Permissions ───────────────────────────────────────────────

export const getMyPermissionsAPI = async (): Promise<{
  permissions: Permission[];
}> => {
  const response = await api.get<{ permissions: Permission[] }>(
    '/auth/my-permissions',
    { withCredentials: true },
  );
  return response.data;
};

// ─── Get Permissions by Space ────────────────────────────────────────────────

export const getPermissionsBySpaceAPI = async (
  spaceId: string,
): Promise<SpacePermissions> => {
  const response = await api.get<SpacePermissions>(
    `/spaces/${spaceId}/permissions`,
    { withCredentials: true },
  );
  return response.data;
};

// ─── Get My Role in Space ────────────────────────────────────────────────────

export const getMyRoleInSpaceAPI = async (
  spaceId: string,
): Promise<SpacePermissions> => {
  const response = await api.get<SpacePermissions>(
    `/spaces/${spaceId}/my-role`,
    { withCredentials: true },
  );
  return response.data;
};