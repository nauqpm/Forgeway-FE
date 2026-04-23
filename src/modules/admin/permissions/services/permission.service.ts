import api from '@/common/utils/api';

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

export interface UserPermission {
  permissionId: Permission;
  userId: string;
}

export class PermissionService {
  private static instance: PermissionService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL + '/permissionsapi';
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async initializePermissions(): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/initialize`, {}, {
        headers: this.getHeaders(),
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        return;
      }
      throw error;
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        headers: this.getHeaders(),
      });

      if (response.data?.permissions) {
        return response.data.permissions;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response format from permissions endpoint');
    } catch (error: any) {
      console.error('Error fetching permissions:', error.response || error);
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const response = await api.get(`${this.baseUrl}/user/${userId}`, {
        headers: this.getHeaders(),
      });

      if (response.data?.permissions) {
        return response.data.permissions;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response format from user permissions endpoint');
    } catch (error: any) {
      console.error('Error fetching user permissions:', error.response || error);
      throw error;
    }
  }

  async updateUserPermissions(userId: string, permissionIds: string[]): Promise<UserPermission[]> {
    try {
      const response = await api.put(
        `${this.baseUrl}/user/${userId}`,
        { userId, permissionIds },
        {
          headers: this.getHeaders(),
        }
      );

      if (response.data?.permissions) {
        return response.data.permissions;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response format when updating user permissions');
    } catch (error: any) {
      console.error('Error updating user permissions:', error.response || error);
      throw error;
    }
  }

  async assignAllPermissionsToUser(userId: string): Promise<UserPermission[]> {
    try {
      const response = await api.post(
        `${this.baseUrl}/admin/${userId}`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      if (response.data?.permissions) {
        return response.data.permissions;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response format when assigning all permissions');
    } catch (error: any) {
      console.error('Error assigning all permissions:', error.response || error);
      throw error;
    }
  }

  async debugGetAllPermissions(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        headers: this.getHeaders(),
      });
      console.log('Raw permissions response:', response);
      console.log('Response data structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        hasPermissions: !!response.data?.permissions,
        hasDataProperty: !!response.data?.data,
        type: typeof response.data,
        keys: response.data ? Object.keys(response.data) : []
      });
      return response.data;
    } catch (error: any) {
      console.error('Debug error:', {
        error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}