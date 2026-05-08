"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PropertyPostService } from './services/property-post.service';
import { IPropertyPost } from './models/property.model';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const MyPosts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<IPropertyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchMyPosts = useCallback(async (page = 1, limit = 10) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Use author parameter to filter by user's posts
      const response = await PropertyPostService.getPropertyPosts({
        page,
        limit,
        author: user.id // Using author parameter to filter by user ID
      });
      
      setPosts(response.items || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 10))
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tải bài đăng của bạn';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchMyPosts(pagination.page, pagination.limit);
    }
  }, [isAuthenticated, user?.id, fetchMyPosts]);

  const handlePageChange = (newPage: number) => {
    fetchMyPosts(newPage, pagination.limit);
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      return;
    }

    try {
      await PropertyPostService.deletePropertyPost(slug);
      toast.success('Xóa bài đăng thành công');
      // Refresh the posts list
      fetchMyPosts(pagination.page, pagination.limit);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa bài đăng';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (post: IPropertyPost) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Từ chối', color: 'bg-red-100 text-red-800' },
      draft: { text: 'Bản nháp', color: 'bg-gray-100 text-gray-800' },
    };

    const status = post.approvalStatus || 'pending';
    const { text, color } = statusMap[status] || { text: 'Không xác định', color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg p-8">
        <h2 className="text-xl font-semibold mb-4">Bạn cần đăng nhập để xem bài đăng của mình</h2>
        <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bài đăng của tôi</h1>
        <Link href="/post-property/create" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">
          Đăng tin mới
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Bạn chưa có bài đăng nào</p>
          <Link href="/post-property/create" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">
            Đăng tin ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diện tích</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {post.thumbnailUrl && (
                          <img 
                            src={post.thumbnailUrl} 
                            alt={post.title} 
                            className="h-10 w-10 rounded-md object-cover mr-3"
                          />
                        )}
                        <div className="truncate max-w-xs">
                          <p className="font-medium text-gray-900">{post.title}</p>
                          <p className="text-sm text-gray-500 truncate">{post.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-primary font-medium">
                        {post.price.toLocaleString('vi-VN')} {post.priceUnit || 'VNĐ'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {post.area} m²
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(post)}
                    </td>
                    <td className="py-4 px-4">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Link href={`/property/${post.slug}`} className="text-blue-600 hover:text-blue-800">
                          <FaEye className="w-5 h-5" />
                        </Link>
                        <Link href={`/post-property/edit/${post.slug}`} className="text-yellow-600 hover:text-yellow-800">
                          <FaEdit className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.slug)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
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
                    className={`px-3 py-1 rounded-md ${
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
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sau
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPosts;
