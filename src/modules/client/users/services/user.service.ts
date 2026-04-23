import api from '@/common/utils/api';
import { IUser, IUserUpdate } from '../models/user.model';

export class UserService {
  // Get current user profile
  static async getCurrentUser(): Promise<IUser> {
    const response = await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  }

  // Update current user profile
  static async updateProfile(data: IUserUpdate): Promise<IUser> {
    const response = await api.put('/users/me', data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }); 
    return response.data;
  }

  // Get user by ID
  static async getUserById(id: string): Promise<IUser> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  // Update user by ID (admin/manager only)
  static async updateUser(id: string, data: IUserUpdate): Promise<IUser> {
    const response = await api.put(`/users/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  }

  // Update avatar (custom endpoint - needs to be added to backend)
  static async updateAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    return response.data;
  }
} 