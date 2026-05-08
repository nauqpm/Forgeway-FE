import api  from '@/common/utils/api';
import { IAmenity, ICreateAmenityDto, IUpdateAmenityDto } from '../models/amenity.model';

export const AdminAmenityService = {
  getAll: async (): Promise<IAmenity[]> => {
    const response = await api.get('/amenitiesapi');
    return response.data;
  },

  getOne: async (id: string): Promise<IAmenity> => {
    const response = await api.get(`/amenitiesapi/${id}`);
    return response.data;
  },

  create: async (data: ICreateAmenityDto): Promise<IAmenity> => {
    const response = await api.post('/amenitiesapi', data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  update: async (id: string, data: IUpdateAmenityDto): Promise<IAmenity> => {
    const response = await api.patch(`/amenitiesapi/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/amenitiesapi/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  initialize: async (): Promise<void> => {
    await api.post('/amenitiesapi/initialize', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
}; 