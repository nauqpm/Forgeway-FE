import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  RoleService,
  Role,
  RoleWithPermissions,
  CreateRoleDto,
  UpdateRoleDto
} from '../services/role.service';
import { Permission } from '../../permissions/services/permission.service';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesWithPermissions, setRolesWithPermissions] = useState<RoleWithPermissions[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<{ permissionId: Permission }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleService = RoleService.getInstance();

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getAllRoles();
      setRoles(data);
      return data;
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      toast.error('Failed to fetch roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all roles with their permissions
  const fetchRolesWithPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getAllRolesWithPermissions();
      setRolesWithPermissions(data);
      return data;
    } catch (err) {
      console.error('Error fetching roles with permissions:', err);
      setError('Failed to fetch roles with permissions');
      toast.error('Failed to fetch roles with permissions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a specific role
  const fetchRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getRoleById(roleId);
      setSelectedRole(data);
      return data;
    } catch (err) {
      console.error(`Error fetching role with ID ${roleId}:`, err);
      setError(`Failed to fetch role with ID ${roleId}`);
      toast.error('Failed to fetch role details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new role
  const createRole = useCallback(async (createRoleDto: CreateRoleDto) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.createRole(createRoleDto);
      setRoles(prevRoles => [...prevRoles, data]);
      toast.success('Role created successfully');
      return data;
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Failed to create role');
      toast.error('Failed to create role');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a role
  const updateRole = useCallback(async (roleId: string, updateRoleDto: UpdateRoleDto) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.updateRole(roleId, updateRoleDto);
      setRoles(prevRoles => prevRoles.map(role => role.id === roleId ? data : role));
      toast.success('Role updated successfully');
      return data;
    } catch (err) {
      console.error(`Error updating role with ID ${roleId}:`, err);
      setError(`Failed to update role with ID ${roleId}`);
      toast.error('Failed to update role');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a role
  const deleteRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { deleted } = await roleService.deleteRole(roleId);
      if (deleted) {
        setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));
        toast.success('Role deleted successfully');
      }
      return deleted;
    } catch (err) {
      console.error(`Error deleting role with ID ${roleId}:`, err);
      setError(`Failed to delete role with ID ${roleId}`);
      toast.error('Failed to delete role');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch role permissions
  const fetchRolePermissions = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getRolePermissions(roleId);
      setRolePermissions(data);
      return data;
    } catch (err) {
      console.error(`Error fetching permissions for role ID ${roleId}:`, err);
      setError(`Failed to fetch permissions for role ID ${roleId}`);
      toast.error('Failed to fetch role permissions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update role permissions
  const updateRolePermissions = useCallback(async (roleId: string, permissionIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.updateRolePermissions(roleId, permissionIds);
      setRolePermissions(data);
      toast.success('Role permissions updated successfully');
      return true;
    } catch (err) {
      console.error(`Error updating permissions for role ID ${roleId}:`, err);
      setError(`Failed to update permissions for role ID ${roleId}`);
      toast.error('Failed to update role permissions');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch of all roles
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    rolesWithPermissions,
    selectedRole,
    rolePermissions,
    loading,
    error,
    fetchRoles,
    fetchRolesWithPermissions,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    fetchRolePermissions,
    updateRolePermissions,
    setSelectedRole
  };
};