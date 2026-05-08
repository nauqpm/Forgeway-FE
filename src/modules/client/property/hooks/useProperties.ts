import { useState, useEffect } from 'react';
import { IPropertyPost, PostVisibility, PostApprovalStatus } from '../../post-property/models/property.model';
import { PropertyService, IPropertyListParams, IPropertyListResponse } from '../services/property.service';

const DEFAULT_PARAMS: IPropertyListParams = {
  page: 1,
  limit: 10,
  visibility: PostVisibility.PUBLIC,
  approvalStatus: PostApprovalStatus.APPROVED,
};

export const useProperties = (initialParams: IPropertyListParams = {}) => {
  const [properties, setProperties] = useState<IPropertyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<IPropertyListParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: DEFAULT_PARAMS.limit,
    totalPages: 0,
  });

  const fetchProperties = async (newParams?: IPropertyListParams) => {
    setLoading(true);
    setError(null);
    try {
      const finalParams = {
        ...DEFAULT_PARAMS,
        ...params,
        ...newParams,
      };
      console.log('Fetching properties with params:', finalParams);
      
      const response = await PropertyService.getProperties(finalParams);
      console.log('Properties response:', response);
      
      setProperties(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
      setParams(finalParams);
    } catch (err) {
      console.error('Error in useProperties:', err);
      setError('Có lỗi xảy ra khi tải danh sách bất động sản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []); // Only fetch on mount

  const updateParams = (newParams: Partial<IPropertyListParams>) => {
    const updatedParams = {
      ...DEFAULT_PARAMS,
      ...params,
      ...newParams,
    };
    fetchProperties(updatedParams);
  };

  return {
    properties,
    loading,
    error,
    params,
    pagination,
    updateParams,
    fetchProperties,
  };
}; 