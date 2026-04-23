import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IPropertyPost } from '../../post-property/models/property.model';
import { IUser } from '../../users/models/user.model';

interface ExtendedPropertyPost extends IPropertyPost {
  authorData?: IUser | null;
}

interface PropertyCardProps {
  property: ExtendedPropertyPost;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatPrice = (price: number, unit?: string) => {
    if (!price) return 'Liên hệ';
    const formatter = new Intl.NumberFormat('vi-VN');
    return `${formatter.format(price)} ${unit || 'VNĐ'}`;
  };

  const formatArea = (area: number) => {
    if (!area) return '';
    return `${area} m²`;
  };

  return (
    <Link href={`/property/${property.slug}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
        <div className="relative h-48 w-full">
          <img
            src={property.thumbnailUrl || '/imgs/placeholder.jpg'}
            alt={property.title}
            width={100}
            height={100}
            className="object-cover h-full w-full"
          />
          {property.propertyStatus && (
            <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-sm">
              {property.propertyStatus}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3
            className="text-lg font-semibold text-gray-800 line-clamp-2 mb-2"
            style={{
              minHeight: '3rem', // 2 lines of text at 1.5rem/line (text-lg = 1.125rem * 1.5 leading)
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {property.title}
          </h3>
          <div className="flex items-center gap-4 text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <i className="fas fa-money-bill text-primary"></i>
              <span>{formatPrice(property.price, property.priceUnit)}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-ruler-combined text-primary"></i>
              <span>{formatArea(property.area)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <i className="fas fa-map-marker-alt text-primary"></i>
            <span className="line-clamp-1">{property.address || 'Đang cập nhật'}</span>
          </div>
          {/* <div className="flex items-center gap-2 text-gray-500 text-sm">
            <i className="fas fa-user text-primary"></i>
            <span>{property.authorData?.fullName || 'Đang tải...'}</span>
          </div> */}
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard; 