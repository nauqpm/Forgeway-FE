"use client";

import React, { useState, useEffect } from 'react';
import { useProperties } from './hooks/useProperties';
import PropertyCard from './components/PropertyCard';
import { PropertyStatus } from '../post-property/models/property.model';
import { UserService } from '../users/services/user.service';
import { IUser } from '../users/models/user.model';
import { useRouter, useSearchParams } from 'next/navigation';

const PropertyList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    areaMin: searchParams.get('areaMin') || '',
    areaMax: searchParams.get('areaMax') || '',
    propertyStatus: searchParams.get('propertyStatus') || '',
  });

  const { properties, loading, error, pagination, updateParams } = useProperties({
    limit: 12,
    page: Number(searchParams.get('page')) || 1,
    priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
    priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
    areaMin: filters.areaMin ? Number(filters.areaMin) : undefined,
    areaMax: filters.areaMax ? Number(filters.areaMax) : undefined,
    propertyStatus: filters.propertyStatus || undefined,
  });

  const [userDataMap, setUserDataMap] = useState<Record<string, IUser>>({});

  // Update URL when filters change
  const updateURL = (newFilters: typeof filters, page?: number) => {
    const params = new URLSearchParams();
    
    // Add filters to URL params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      }
    });

    // Add page to URL params
    if (page && page > 1) {
      params.set('page', page.toString());
    }

    // Update URL without reloading the page
    const queryString = params.toString();
    const newURL = queryString ? `?${queryString}` : '';
    router.push(newURL);
  };

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const userData = await UserService.getUserById(userId);
        if (userData && userData.id) {
          setUserDataMap(prev => ({
            ...prev,
            [userId]: userData
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    properties.forEach(property => {
      const authorId = typeof property.author === 'string' ? property.author : property.author?.id;
      if (authorId && !userDataMap[authorId]) {
        fetchUserData(authorId);
      }
    });
  }, [properties]);

  // Sync filters from URL when component mounts or URL changes
  useEffect(() => {
    const newFilters = {
      priceMin: searchParams.get('priceMin') || '',
      priceMax: searchParams.get('priceMax') || '',
      areaMin: searchParams.get('areaMin') || '',
      areaMax: searchParams.get('areaMax') || '',
      propertyStatus: searchParams.get('propertyStatus') || '',
    };

    setFilters(newFilters);
    
    // Update properties with URL params
    updateParams({
      page: Number(searchParams.get('page')) || 1,
      priceMin: newFilters.priceMin ? Number(newFilters.priceMin) : undefined,
      priceMax: newFilters.priceMax ? Number(newFilters.priceMax) : undefined,
      areaMin: newFilters.areaMin ? Number(newFilters.areaMin) : undefined,
      areaMax: newFilters.areaMax ? Number(newFilters.areaMax) : undefined,
      propertyStatus: newFilters.propertyStatus || undefined,
    });
  }, [searchParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const numericFilters = {
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      areaMin: filters.areaMin ? Number(filters.areaMin) : undefined,
      areaMax: filters.areaMax ? Number(filters.areaMax) : undefined,
      propertyStatus: filters.propertyStatus || undefined,
    };
    updateParams({ ...numericFilters, page: 1 });
    updateURL(filters, 1);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    updateURL(filters, newPage);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      priceMin: '',
      priceMax: '',
      areaMin: '',
      areaMax: '',
      propertyStatus: '',
    };
    setFilters(emptyFilters);
    updateParams({ page: 1 });
    updateURL(emptyFilters, 1);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Có lỗi xảy ra khi tải danh sách bất động sản</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => updateParams({})}
            className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tìm kiếm bất động sản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá tối thiểu
            </label>
            <input
              type="number"
              name="priceMin"
              value={filters.priceMin}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="VNĐ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá tối đa
            </label>
            <input
              type="number"
              name="priceMax"
              value={filters.priceMax}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="VNĐ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diện tích tối thiểu
            </label>
            <input
              type="number"
              name="areaMin"
              value={filters.areaMin}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="m²"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diện tích tối đa
            </label>
            <input
              type="number"
              name="areaMax"
              value={filters.areaMax}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="m²"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              name="propertyStatus"
              value={filters.propertyStatus}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              <option value={PropertyStatus.AVAILABLE}>Còn trống</option>
              <option value={PropertyStatus.SOLD}>Đã bán</option>
              <option value={PropertyStatus.RENTED}>Đã cho thuê</option>
              <option value={PropertyStatus.PENDING}>Đang giao dịch</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Xóa bộ lọc
          </button>
          <button
            onClick={handleApplyFilters}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Áp dụng bộ lọc'}
          </button>
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Đang tải danh sách bất động sản...</p>
        </div>
      ) : (
        <>
          {properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => (
                  <PropertyCard 
                    key={property.slug} 
                    property={{
                      ...property,
                      authorData: property.author ? (
                        typeof property.author === 'string' 
                          ? userDataMap[property.author] 
                          : userDataMap[property.author.id]
                      ) : null
                    } as any} 
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-4 py-2 rounded-md ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Trước
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-md ${
                        page === pagination.page
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-4 py-2 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <p className="text-gray-600 text-lg">Không tìm thấy bất động sản nào phù hợp</p>
                <p className="text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc quay lại sau</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyList; 