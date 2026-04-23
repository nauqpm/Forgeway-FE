import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { RoleService, AssignRoleDto } from '../services/role.service';

interface UserRole {
  hasCustomRole: boolean;
  customRole?: {
    id: string;
    name: string;
    description?: string;
  };
  standardRole: string;
}

export const useUserRoles = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleService = RoleService.getInstance();

  // Get user's current role
  const getUserRole = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getUserRole(userId);
      setUserRole(data);
      return data;
    } catch (err) {
      console.error(`Error fetching role for user ID ${userId}:`, err);
      setError(`Failed to fetch role for user ID ${userId}`);
      toast.error('Failed to fetch user role');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign a role to a user
  const assignRoleToUser = useCallback(async (assignRoleDto: AssignRoleDto) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.assignRoleToUser(assignRoleDto);
      toast.success('Role assigned successfully');
      return data;
    } catch (err) {
      console.error('Error assigning role to user:', err);
      setError('Failed to assign role to user');
      toast.error('Failed to assign role to user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a role from a user
  const removeRoleFromUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.removeRoleFromUser(userId);
      toast.success('Role removed successfully');
      return data;
    } catch (err) {
      console.error(`Error removing role from user ID ${userId}:`, err);
      setError(`Failed to remove role from user ID ${userId}`);
      toast.error('Failed to remove role from user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    userRole,
    loading,
    error,
    getUserRole,
    assignRoleToUser,
    removeRoleFromUser
  };
};