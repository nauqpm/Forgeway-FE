import { useState, useEffect } from 'react';
import { AmenityService, IAmenity } from '../services/amenity.service';
import { toast } from 'react-hot-toast';

export const useAmenities = () => {
  const [amenities, setAmenities] = useState<IAmenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AmenityService.getAll();
      setAmenities(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching amenities');
      toast.error('Không thể tải danh sách tiện ích');
    } finally {
      setLoading(false);
    }
  };

  const createAmenity = async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const newAmenity = await AmenityService.create(name);
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

  const deleteAmenity = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await AmenityService.delete(id);
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

  useEffect(() => {
    fetchAmenities();
  }, []);

  return {
    amenities,
    loading,
    error,
    fetchAmenities,
    createAmenity,
    deleteAmenity
  };
}; 