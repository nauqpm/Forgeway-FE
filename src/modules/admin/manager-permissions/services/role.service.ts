import api from '@/common/utils/api';
import { Permission } from '../../permissions/services/permission.service';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}

export class RoleService {
  private static instance: RoleService;
  private baseUrl: string;
  private userRolesUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL + '/roles';
    this.userRolesUrl = process.env.NEXT_PUBLIC_API_URL + '/user-roles';
  }

  public static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Role Management
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    try {
      const response = await api.get(`${this.baseUrl}/with-permissions`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching roles with permissions:', error);
      throw error;
    }
  }

  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching role with ID ${id}:`, error);
      throw error;
    }
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      const response = await api.post(`${this.baseUrl}`, createRoleDto, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, updateRoleDto, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating role with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteRole(id: string): Promise<{ deleted: boolean }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting role with ID ${id}:`, error);
      throw error;
    }
  }

  // Role Permissions
  async getRolePermissions(roleId: string): Promise<{ permissionId: Permission }[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${roleId}/permissions`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching permissions for role ID ${roleId}:`, error);
      throw error;
    }
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<{ permissionId: Permission }[]> {
    try {
      const response = await api.put(
        `${this.baseUrl}/${roleId}/permissions`,
        { permissionIds },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating permissions for role ID ${roleId}:`, error);
      throw error;
    }
  }

  // User Role Management
  async assignRoleToUser(assignRoleDto: AssignRoleDto): Promise<any> {
    try {
      const response = await api.post(`${this.userRolesUrl}`, assignRoleDto, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error assigning role to user:`, error);
      throw error;
    }
  }

  async removeRoleFromUser(userId: string): Promise<any> {
    try {
      const response = await api.delete(`${this.userRolesUrl}/${userId}/role`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing role from user:`, error);
      throw error;
    }
  }

  async getUserRole(userId: string): Promise<any> {
    try {
      const response = await api.get(`${this.userRolesUrl}/${userId}/role`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user role:`, error);
      throw error;
    }
  }
}