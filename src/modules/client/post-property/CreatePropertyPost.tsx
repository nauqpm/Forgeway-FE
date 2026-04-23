"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PropertyPostForm from './components/PropertyPostForm';

const CreatePropertyPost: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Đăng tin thành công');
    router.push('/post-property'); // Redirect to property list after successful creation
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đăng tin mới</h1>
      <PropertyPostForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CreatePropertyPost; 