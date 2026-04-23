import { useState, useCallback, useEffect } from 'react';
import { AdminPropertyService, IAdminPropertyListParams, IAdminPropertyListResponse, IApprovePropertyDto } from '../services/admin-property.service';
import { IPropertyPost } from '../../../client/post-property/models/property.model';
import { toast } from 'react-hot-toast';

export const useAdminProperties = (initialParams: IAdminPropertyListParams = {}) => {
  const [properties, setProperties] = useState<IPropertyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [params, setParams] = useState<IAdminPropertyListParams>(initialParams);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminPropertyService.getProperties(params);
      setProperties(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching properties');
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const approveProperty = useCallback(async (id: string, data: IApprovePropertyDto) => {
    try {
      setLoading(true);
      await AdminPropertyService.approveProperty(id, data);
      toast.success('Property approval status updated successfully');
      await fetchProperties();
    } catch (err) {
      toast.error('Failed to update property approval status');
    } finally {
      setLoading(false);
    }
  }, [fetchProperties]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await AdminPropertyService.deleteProperty(id);
      toast.success('Property deleted successfully');
      await fetchProperties();
    } catch (err) {
      toast.error('Failed to delete property');
    } finally {
      setLoading(false);
    }
  }, [fetchProperties]);

  const toggleHighlight = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await AdminPropertyService.toggleHighlight(id);
      toast.success('Property highlight status updated successfully');
      await fetchProperties();
    } catch (err) {
      toast.error('Failed to update property highlight status');
    } finally {
      setLoading(false);
    }
  }, [fetchProperties]);

  const updateParams = useCallback((newParams: Partial<IAdminPropertyListParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    pagination,
    params,
    updateParams,
    approveProperty,
    deleteProperty,
    toggleHighlight,
    refetch: fetchProperties,
  };
}; 