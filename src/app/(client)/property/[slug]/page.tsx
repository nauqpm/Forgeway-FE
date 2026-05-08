import React from 'react';
import DetailPropertyPost from '@/modules/client/property/DetailPropertyPost';
import ClientLayout from '@/modules/client/common/layouts/ClientLayout';

export async function generateMetadata() {
  return {
    title: `Chi tiết bất động sản | Duc Hoa`,
    description: 'Thông tin chi tiết về bất động sản',
  };
}

interface PropertyDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const {slug} = await params;
  return (
    <ClientLayout>
      <DetailPropertyPost slug={slug} />
    </ClientLayout>
  );
};
