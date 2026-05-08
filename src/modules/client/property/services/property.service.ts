import axios from 'axios';
import { IPropertyPost, PostVisibility, PostApprovalStatus } from '../../post-property/models/property.model';

// Ensure no double slash in API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
const API_URL = `${BASE_URL}/property-postsapi`;

export interface IPropertyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  propertyStatus?: string;
  visibility?: PostVisibility;
  approvalStatus?: PostApprovalStatus;
}

export interface IPropertyListResponse {
  items: IPropertyPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PropertyService {
  static async getProperties(params: IPropertyListParams = {}): Promise<IPropertyListResponse> {
    try {
      // Force visibility and approvalStatus parameters regardless of what was passed
      const defaultParams = {
        ...params,
        // Explicitly set these parameters to ensure only public and approved properties are shown
        visibility: PostVisibility.PUBLIC,
        approvalStatus: PostApprovalStatus.APPROVED,
      };

      // Convert all numeric strings to numbers
      const processedParams = Object.entries(defaultParams).reduce((acc, [key, value]) => {
        if (value === undefined || value === null || value === '') {
          return acc;
        }
        // Convert numeric strings to numbers for price and area filters
        if (['priceMin', 'priceMax', 'areaMin', 'areaMax', 'page', 'limit'].includes(key) && typeof value === 'string') {
          acc[key] = Number(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const queryParams = new URLSearchParams();
      Object.entries(processedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      // Ensure visibility and approvalStatus are explicitly set in the URL parameters
      queryParams.set('visibility', PostVisibility.PUBLIC);
      queryParams.set('approvalStatus', PostApprovalStatus.APPROVED);

      const url = `${API_URL}?${queryParams.toString()}`;
      const response = await axios.get<IPropertyListResponse>(url);
      
      // Additional client-side filtering to ensure only public and approved properties are included
      const filteredItems = response.data.items.filter(item => 
        item.visibility === PostVisibility.PUBLIC && 
        item.approvalStatus === PostApprovalStatus.APPROVED
      );
      
      // Ensure all items have an id field
      const processedItems = filteredItems.map(item => ({
        ...item,
        id: item.id || item._id?.toString(),
      }));

      return {
        ...response.data,
        items: processedItems,
        total: processedItems.length, // Update total to reflect filtered count
      };
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  static async getPropertyBySlug(slug: string): Promise<IPropertyPost> {
    try {
      // Explicitly include query parameters to ensure only public and approved properties can be viewed
      const queryParams = new URLSearchParams({
        visibility: PostVisibility.PUBLIC,
        approvalStatus: PostApprovalStatus.APPROVED
      });
      
      const url = `${API_URL}/slug/${slug}?${queryParams.toString()}`;
      const response = await axios.get<IPropertyPost>(url);
      
      // Strict client-side verification to ensure the property is public and approved
      if (response.data.visibility !== PostVisibility.PUBLIC || 
          response.data.approvalStatus !== PostApprovalStatus.APPROVED) {
        throw new Error('Property not available or not approved for public viewing');
      }
      
      // Ensure the response has an id field
      return {
        ...response.data,
        id: response.data.id || response.data._id?.toString(),
      };
    } catch (error) {
      console.error('Error fetching property by slug:', error);
      throw error;
    }
  }

  static async getRelatedProperties(slug: string, limit: number = 4): Promise<IPropertyPost[]> {
    try {
      // Ensure limit is a number
      const numericLimit = Number(limit);
      if (isNaN(numericLimit) || numericLimit < 1) {
        console.warn('Invalid limit provided, using default of 4');
        limit = 4;
      }

      const url = `${API_URL}/${encodeURIComponent(slug)}/related?limit=${limit}`;
      console.log('Fetching related properties from:', url);
      
      const response = await axios.get<IPropertyPost[]>(url);
      console.log('Related properties response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format, expected array:', response.data);
        return [];
      }

      // Ensure all items have an id field
      return response.data.map(item => ({
        ...item,
        id: item.id || item._id?.toString(),
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching related properties:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('Error fetching related properties:', error);
      }
      return [];
    }
  }
} 