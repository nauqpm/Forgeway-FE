import React from 'react';
import PropertyList from '@/modules/client/property/PropertyList';
import ClientLayout from '@/modules/client/common/layouts/ClientLayout';

export const metadata = {
  title: 'Danh sách bất động sản | Duc Hoa',
  description: 'Khám phá danh sách bất động sản đa dạng với nhiều lựa chọn phù hợp với nhu cầu của bạn.',
};

const PropertyPage = () => {
  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách bất động sản
          </h1>
          <p className="text-gray-600 mb-8">
            Khám phá danh sách bất động sản đa dạng với nhiều lựa chọn phù hợp với nhu cầu của bạn.
          </p>
        </div>
      </div>
      <PropertyList />
    </div>
    </ClientLayout>
  );
};

export default PropertyPage; 