"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePropertyPost } from './hooks/usePropertyPost';
import { IPropertyPost } from './models/property.model';
import { toast } from 'react-hot-toast';
import PropertyPostForm from './components/PropertyPostForm';

interface EditPropertyPostProps {
  slug: string;
}

const EditPropertyPost: React.FC<EditPropertyPostProps> = ({ slug }) => {
  const router = useRouter();
  const { getPropertyPost } = usePropertyPost();
  const [propertyPost, setPropertyPost] = useState<IPropertyPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyPost = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const data = await getPropertyPost(slug);
      setPropertyPost(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải thông tin dự án');
      toast.error('Không thể tải thông tin dự án');
    } finally {
      setLoading(false);
    }
  }, [slug, getPropertyPost]);

  useEffect(() => {
    fetchPropertyPost();
  }, [fetchPropertyPost]);

  const handleSuccess = () => {
    toast.success('Cập nhật thành công');
    router.push('/post-property'); // Redirect to property list after successful update
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !propertyPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error || 'Không tìm thấy dự án'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Chỉnh sửa dự án</h1>
      <PropertyPostForm
        initialValues={propertyPost}
        slug={propertyPost.slug}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EditPropertyPost; 