import api  from '@/common/utils/api';

export interface IAmenity {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AmenityService = {
  getAll: async (): Promise<IAmenity[]> => {
    const response = await api.get('/amenitiesapi');
    return response.data;
  },

  getOne: async (id: string): Promise<IAmenity> => {
    const response = await api.get(`/amenitiesapi/${id}`);
    return response.data;
  },

  create: async (name: string): Promise<IAmenity> => {
    const response = await api.post('/amenitiesapi', { name });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/amenitiesapi/${id}`);
  },
};
