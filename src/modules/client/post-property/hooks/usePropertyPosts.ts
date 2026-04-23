import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PropertyPostService } from '../services/property-post.service';
import { IPropertyPost } from '../models/property.model';

export interface IPropertyPostsFilter {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  propertyStatus?: string;
}

export const usePropertyPosts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyPosts, setPropertyPosts] = useState<IPropertyPost[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getPropertyPosts = useCallback(async (filters: IPropertyPostsFilter = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { items, total, page, limit } = await PropertyPostService.getPropertyPosts({
        ...filters,
        page: filters.page || 1,
        limit: filters.limit || 10,
      });
      setPropertyPosts(items);
      setPagination({
        current: page,
        pageSize: limit,
        total,
      });
      return { items, total, page, limit };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách tin đăng';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyPropertyPosts = useCallback(async (params: {
    page?: number;
    limit?: number;
    sort?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { items, total, page, limit } = await PropertyPostService.getPropertyPosts({
        page: params.page || 1,
        limit: params.limit || 10,
        status: 'active',
      });
      setPropertyPosts(items);
      setPagination({
        current: page,
        pageSize: limit,
        total,
      });
      return { items, total, page, limit };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách tin đăng của bạn';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPropertyPosts = useCallback(async () => {
    return getPropertyPosts({
      page: pagination.current,
      limit: pagination.pageSize,
    });
  }, [getPropertyPosts, pagination.current, pagination.pageSize]);

  const refreshMyPropertyPosts = useCallback(async () => {
    return getMyPropertyPosts({
      page: pagination.current,
      limit: pagination.pageSize,
    });
  }, [getMyPropertyPosts, pagination.current, pagination.pageSize]);

  return {
    loading,
    error,
    propertyPosts,
    pagination,
    getPropertyPosts,
    getMyPropertyPosts,
    refreshPropertyPosts,
    refreshMyPropertyPosts,
  };
};