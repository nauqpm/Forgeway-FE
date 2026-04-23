import { useState, useCallback } from 'react';
import { IPropertyPostCreate, IPropertyPostUpdate } from '../models/property.model';
import { PropertyPostService } from '../services/property-post.service';

export const usePropertyPost = () => {
  const [loading, setLoading] = useState(false);

  const createPropertyPost = useCallback(async (data: IPropertyPostCreate) => {
    setLoading(true);
    try {
      const response = await PropertyPostService.createPropertyPost(data);
      return response;
    } catch (error) {
      console.error('Error creating property post:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePropertyPost = useCallback(async (slug: string, data: IPropertyPostUpdate) => {
    setLoading(true);
    try {
      const response = await PropertyPostService.updatePropertyPost(slug, data);
      return response;
    } catch (error) {
      console.error('Error updating property post:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertyPost = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const response = await PropertyPostService.getPropertyPost(slug);
      return response;
    } catch (error) {
      console.error('Error fetching property post:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePropertyPost = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      await PropertyPostService.deletePropertyPost(slug);
      return true;
    } catch (error) {
      console.error('Error deleting property post:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertyPosts = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    visibility?: string;
    search?: string;
  }) => {
    setLoading(true);
    try {
      const response = await PropertyPostService.getPropertyPosts(params);
      return response;
    } catch (error) {
      console.error('Error fetching property posts:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createPropertyPost,
    updatePropertyPost,
    getPropertyPost,
    deletePropertyPost,
    getPropertyPosts,
  };
};