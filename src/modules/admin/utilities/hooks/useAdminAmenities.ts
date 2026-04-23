import { useState, useEffect } from 'react';
import { AdminAmenityService } from '../services/amenity.service';
import { IAmenity, ICreateAmenityDto, IUpdateAmenityDto } from '../models/amenity.model';
import { toast } from 'react-hot-toast';

export const useAdminAmenities = () => {
  const [amenities, setAmenities] = useState<IAmenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminAmenityService.getAll();
      setAmenities(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching amenities');
      toast.error('Không thể tải danh sách tiện ích');
    } finally {
      setLoading(false);
    }
  };

  const createAmenity = async (data: ICreateAmenityDto) => {
    try {
      setLoading(true);
      setError(null);
      const newAmenity = await AdminAmenityService.create(data);
      setAmenities(prev => [...prev, newAmenity]);
      toast.success('Thêm tiện ích thành công');
      return newAmenity;
    } catch (err: any) {
      setError(err.message || 'Error creating amenity');
      toast.error('Không thể thêm tiện ích');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAmenity = async (id: string, data: IUpdateAmenityDto) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAmenity = await AdminAmenityService.update(id, data);
      setAmenities(prev => prev.map(amenity => 
        amenity._id === id ? updatedAmenity : amenity
      ));
      toast.success('Cập nhật tiện ích thành công');
      return updatedAmenity;
    } catch (err: any) {
      setError(err.message || 'Error updating amenity');
      toast.error('Không thể cập nhật tiện ích');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAmenity = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await AdminAmenityService.delete(id);
      setAmenities(prev => prev.filter(amenity => amenity._id !== id));
      toast.success('Xóa tiện ích thành công');
    } catch (err: any) {
      setError(err.message || 'Error deleting amenity');
      toast.error('Không thể xóa tiện ích');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializeAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      await AdminAmenityService.initialize();
      await fetchAmenities();
      toast.success('Khởi tạo tiện ích mặc định thành công');
    } catch (err: any) {
      setError(err.message || 'Error initializing amenities');
      toast.error('Không thể khởi tạo tiện ích mặc định');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  return {
    amenities,
    loading,
    error,
    fetchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    initializeAmenities
  };
}; 