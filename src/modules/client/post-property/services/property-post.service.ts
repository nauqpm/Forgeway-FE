import axios from 'axios';
import { IPropertyPost, IPropertyPostCreate, IPropertyPostUpdate } from '../models/property.model';

// Ensure no double slash in API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
const API_URL = `${BASE_URL}/property-postsapi`;

export class PropertyPostService {
  static async createPropertyPost(data: IPropertyPostCreate): Promise<IPropertyPost> {
    try {
      console.log('Creating property post with data:', JSON.stringify(data, null, 2));
      const response = await axios.post<IPropertyPost>(API_URL, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Property post created successfully. Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error creating property post:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Response status:', error.response?.status);
        console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
      }
      throw PropertyPostService.handleError(error);
    }
  }

  static async updatePropertyPost(slug: string, data: IPropertyPostUpdate): Promise<IPropertyPost> {  
    try {
      console.log(`Updating property post ${slug} with data:`, JSON.stringify(data, null, 2));
      const response = await axios.patch<IPropertyPost>(`${API_URL}/${slug}`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Property post updated successfully. Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error updating property post:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Response status:', error.response?.status);
        console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
      }
      throw PropertyPostService.handleError(error);
    }
  }

  static async getPropertyPost(slug: string): Promise<IPropertyPost> {
    try {
      console.log(`Fetching property post ${slug}`);
      const response = await axios.get<IPropertyPost>(`${API_URL}/${slug}`);
      console.log('Property post fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching property post:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw PropertyPostService.handleError(error);
    }
  }

  static async deletePropertyPost(slug: string): Promise<void> {
    try {
      console.log(`Deleting property post ${slug}`);
      await axios.delete(`${API_URL}/${slug}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Property post deleted successfully');
    } catch (error) {
      console.error('Error deleting property post:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw PropertyPostService.handleError(error);
    }
  }

  static async getPropertyPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    visibility?: string;
    search?: string;
    author?: string;
  }): Promise<{ items: IPropertyPost[]; total: number; page: number; limit: number }> {
    try {
      console.log('Fetching property posts with params:', params);
      const response = await axios.get(API_URL, { params });
      console.log('Property posts fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching property posts:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw PropertyPostService.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      // If backend returns array of messages, join them
      let message = error.response?.data?.message;
      if (Array.isArray(message)) {
        // Format validation errors nicely
        message = message.map(msg => {
          // Remove "should not be empty" and similar generic messages
          if (msg.includes('should not be empty')) {
            const field = msg.split(' ')[0];
            return `${field} là bắt buộc`;
          }
          // Handle number type errors
          if (msg.includes('must be a number')) {
            const field = msg.split(' ')[0];
            return `${field} phải là số`;
          }
          // Handle string type errors
          if (msg.includes('must be a string')) {
            const field = msg.split(' ')[0];
            return `${field} phải là chuỗi`;
          }
          return msg;
        }).join('\n');
      }
      message = message || error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}