import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PermissionService, Permission, UserPermission } from '../services/permission.service';
import { toast } from 'react-hot-toast';

export const usePermissions = (userId?: string) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissionService = PermissionService.getInstance();

  // Fetch all available permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await permissionService.getAllPermissions();
      setPermissions(data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to fetch permissions');
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's permissions
  const fetchUserPermissions = useCallback(async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await permissionService.getUserPermissions(id);
      setUserPermissions(data);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError('Failed to fetch user permissions');
      toast.error('Failed to fetch user permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user's permissions
  const updateUserPermissions = useCallback(async (targetUserId: string, permissionIds: string[]) => {
    if (!targetUserId) return false;
    try {
      setLoading(true);
      setError(null);
      const updatedPermissions = await permissionService.updateUserPermissions(targetUserId, permissionIds);
      setUserPermissions(updatedPermissions)
      return true;
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions');
      toast.error('Failed to update permissions');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user has specific permission
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    return userPermissions.some(
      up => up.permissionId.resource === resource && up.permissionId.action === action
    );
  }, [userPermissions]);

  // Group permissions by resource
  const groupedPermissions = useCallback(() => {
    return permissions.reduce((acc, permission) => {
      const { resource } = permission;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  // Initial fetch of all permissions
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Fetch user permissions when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserPermissions(userId);
    } else {
      setUserPermissions([]);
    }
  }, [userId, fetchUserPermissions]);

  return {
    permissions,
    userPermissions,
    loading,
    error,
    updateUserPermissions,
    hasPermission,
    groupedPermissions,
    fetchUserPermissions,
    fetchPermissions,
  };
};