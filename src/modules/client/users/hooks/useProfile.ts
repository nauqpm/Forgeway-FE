import { useState, useEffect } from 'react';
import { useAuth } from '@/common/hooks/useAuth';
import { UserService } from '../services/user.service';
import { IUser, IUserUpdate } from '../models/user.model';
import { toast } from 'react-hot-toast';

export const useProfile = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await UserService.getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: IUserUpdate) => {
    try {
      setUpdating(true);
      const updatedUser = await UserService.updateProfile(data);
      setUser(updatedUser);
      toast.success('Cập nhật thông tin thành công');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const updateAvatar = async (file: File) => {
    try {
      setUpdating(true);
      const { url } = await UserService.updateAvatar(file);
      const updatedUser = await UserService.updateProfile({ avatar: url });
      setUser(updatedUser);
      toast.success('Cập nhật ảnh đại diện thành công');
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Không thể cập nhật ảnh đại diện');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    user,
    loading,
    updating,
    updateProfile,
    updateAvatar,
    refreshProfile: fetchUserProfile,
  };
}; 