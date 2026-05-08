import axios from 'axios';
import { IPropertyPost, PostApprovalStatus } from '../../../client/post-property/models/property.model';

// Ensure no double slash in API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
const API_URL = `${BASE_URL}/property-postsapi`;
console.log('Admin Property Service API_URL:', API_URL);

export interface IAdminPropertyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  approvalStatus?: PostApprovalStatus;
}

export interface IAdminPropertyListResponse {
  items: IPropertyPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IApprovePropertyDto {
  approvalStatus?: PostApprovalStatus;
  rejectionReason?: string;
}

export class AdminPropertyService {
  static async getProperties(params: IAdminPropertyListParams = {}): Promise<IAdminPropertyListResponse> {
    try {
      console.log('Fetching properties with params:', params);
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await axios.get<IAdminPropertyListResponse>(`${API_URL}?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Properties response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  static async getPendingProperties(params: IAdminPropertyListParams = {}): Promise<IAdminPropertyListResponse> {
    try {
      const response = await axios.get<IAdminPropertyListResponse>(`${API_URL}/pending-approval`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending properties:', error);
      throw error;
    }
  }

  static async approveProperty(slug: string, data: IApprovePropertyDto): Promise<IPropertyPost> {
    try {
      console.log(`Approving property ${slug} with data:`, JSON.stringify(data, null, 2));
      console.log('Request URL:', `${API_URL}/${slug}/approve`);
      
      const response = await axios.put<IPropertyPost>(
        `${API_URL}/${slug}/approve`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Approval response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error approving property:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Response status:', error.response?.status);
        console.error('Request URL:', error.config?.url);
        console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
      }
      throw error;
    }
  }

  static async deleteProperty(id: string): Promise<void> {
    try {
      console.log(`Deleting property ${id}`);
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  static async toggleHighlight(id: string): Promise<IPropertyPost> {
    try {
      console.log(`Toggling highlight for property ${id}`);
      const response = await axios.put<IPropertyPost>(
        `${API_URL}/${id}/highlight`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Toggle highlight response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error toggling highlight:', error);
      throw error;
    }
  }
} 