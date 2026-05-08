"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaPhone, FaUser, FaCalendarAlt, FaEye, FaShareAlt, FaHeart, FaFlag } from 'react-icons/fa';
import { PropertyService } from './services/property.service';
import { IPropertyPost, PropertyStatus } from '../post-property/models/property.model';
import { transformSunEditorHtml } from '@/utils/transformSunEditorHtml';
import { UserService } from '../users/services/user.service';
import { IUser } from '../users/models/user.model';

interface DetailPropertyPostProps {
  slug: string;
}

// Add RelatedProperties component before DetailPropertyPost
interface RelatedPropertiesProps {
  properties: IPropertyPost[];
  currentSlug: string;
}

const RelatedProperties: React.FC<RelatedPropertiesProps> = ({ properties, currentSlug }) => {
  const formatPrice = (price: number, unit?: string) => {
    if (!price) return 'Liên hệ';
    const formatter = new Intl.NumberFormat('vi-VN');
    return `${formatter.format(price)} ${unit || 'VNĐ'}`;
  };

  if (!properties.length) {
    return (
      <p className="text-gray-500 text-sm">Chưa có bất động sản tương tự.</p>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <Link 
          key={property.id} 
          href={`/property/${property.slug}`}
          className={`block bg-white rounded-lg overflow-hidden hover:shadow-md transition ${
            property.slug === currentSlug ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <div className="flex">
            <div className="flex-1 w-20 h-28">
              <img
                src={property.albumUrls?.[0] || '/imgs/placeholder.jpg'}
                alt={property.title}
                width={60}
                height={60}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{property.title}</h4>
              <div className="text-primary text-sm font-semibold">
                {formatPrice(property.price, property.priceUnit)}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {property.area} m² • {property.numberOfBedrooms || 0} PN
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const DetailPropertyPost: React.FC<DetailPropertyPostProps> = ({ slug }) => {
  const [property, setProperty] = useState<IPropertyPost | null>(null);
  const [author, setAuthor] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState<IPropertyPost[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    const fetchPropertyAndAuthor = async () => {
      try {
        setLoading(true);
        setLoadingRelated(true);
        
        // Fetch main property
        const data = await PropertyService.getPropertyBySlug(slug);
        setProperty(data);
        console.log('Main property data:', data);

        // Fetch author information if we have an author ID
        if (data.author && typeof data.author === 'object' && data.author.id) {
          try {
            const authorData = await UserService.getUserById(data.author.id);
            setAuthor(authorData);
          } catch (err) {
            console.error('Error fetching author:', err);
          }
        }

        // Fetch related properties
        const relatedData = await PropertyService.getRelatedProperties(slug);
        console.log('Related properties data:', relatedData);
        setRelatedProperties(relatedData);

        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Không thể tải thông tin bất động sản. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
        setLoadingRelated(false);
      }
    };

    if (slug) {
      fetchPropertyAndAuthor();
    }
  }, [slug]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h3>
          <p>{error || 'Không tìm thấy thông tin bất động sản'}</p>
          <Link href="/property" className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Gallery Section */}
        <PropertyGallery 
          images={property.albumUrls || []} 
          title={property.title}
          activeIndex={activeImageIndex}
          setActiveIndex={setActiveImageIndex}
          showAllImages={showAllImages}
          setShowAllImages={setShowAllImages}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Basic Information */}
            <PropertyBasicInfo property={property} />
            
            {/* Description */}
            <PropertyDescription description={property.description} />
            
            {/* Features */}
            <PropertyFeatures property={property} />
            
            {/* Location */}
            <PropertyLocation 
              address={property.address || ''} 
              coordinates={property.location?.type?.coordinates} 
              iframe={property.iframe}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Agent Card */}
            <PropertyContactCard 
              contactName={author?.fullName || (typeof property.author === 'object' ? property.author.name : '') || 'Chủ nhà'} 
              contactPhone={author?.phone || (typeof property.author === 'object' ? property.author.phone : '') || ''} 
              price={property.price}
              priceUnit={property.priceUnit}
            />
            
            {/* Similar Properties */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4">Bất động sản tương tự</h3>
              {loadingRelated ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="w-24 h-24 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <RelatedProperties properties={relatedProperties} currentSlug={slug} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyDetailSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* Gallery skeleton */}
        <div className="aspect-video bg-gray-200 rounded-lg mb-8"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Title skeleton */}
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded mb-8 w-1/2"></div>
            
            {/* Info skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-3 mb-8">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {/* Agent card skeleton */}
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            
            {/* Similar properties skeleton */}
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PropertyGalleryProps {
  images: string[];
  title: string;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  showAllImages: boolean;
  setShowAllImages: (show: boolean) => void;
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ 
  images, 
  title, 
  activeIndex, 
  setActiveIndex,
  showAllImages,
  setShowAllImages
}) => {
  const defaultImage = '/imgs/placeholder.jpg';
  const imageList = images.length > 0 ? images : [defaultImage];
  
  const handlePrevImage = () => {
    setActiveIndex((activeIndex - 1 + imageList.length) % imageList.length);
  };
  
  const handleNextImage = () => {
    setActiveIndex((activeIndex + 1) % imageList.length);
  };

  return (
    <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Main Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={imageList[activeIndex]}
          alt={`${title} - Ảnh ${activeIndex + 1}`}
          fill
          className="object-cover"
        />
        
        {/* Navigation Arrows */}
        <button 
          onClick={handlePrevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <button 
          onClick={handleNextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        
        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {activeIndex + 1} / {imageList.length}
        </div>
      </div>
      
      {/* Thumbnails */}
      {imageList.length > 1 && (
        <div className="p-2 overflow-x-auto">
          <div className="flex gap-2">
            {imageList.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border-2 ${
                  index === activeIndex ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PropertyBasicInfoProps {
  property: IPropertyPost;
}

const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = ({ property }) => {
  const formatPrice = (price: number, unit?: string) => {
    if (!price) return 'Liên hệ';
    const formatter = new Intl.NumberFormat('vi-VN');
    return `${formatter.format(price)} ${unit || 'VNĐ'}`;
  };

  // Format full address with city, district, ward information
  const getFullAddress = () => {
    const addressParts = [];
    if (property.address) addressParts.push(property.address);
    if (property.ward) addressParts.push(property.ward);
    if (property.district) addressParts.push(property.district);
    if (property.city) addressParts.push(property.city);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Đang cập nhật địa chỉ';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{property.title}</h1>
          <div className="flex items-center text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-primary" />
            <span>{getFullAddress()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(property.price, property.priceUnit)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            <FaRulerCombined className="inline mr-1" />
            {property.area} m²
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center bg-gray-50 p-3 rounded-lg">
          <FaBed className="text-primary text-xl mr-3" />
          <div>
            <div className="text-lg font-semibold">{property.numberOfBedrooms || 'N/A'}</div>
            <div className="text-xs text-gray-500">Phòng ngủ</div>
          </div>
        </div>
        
        <div className="flex items-center bg-gray-50 p-3 rounded-lg">
          <FaBath className="text-primary text-xl mr-3" />
          <div>
            <div className="text-lg font-semibold">{property.numberOfBathrooms || 'N/A'}</div>
            <div className="text-xs text-gray-500">Phòng tắm</div>
          </div>
        </div>
        
        <div className="flex items-center bg-gray-50 p-3 rounded-lg">
          <FaRulerCombined className="text-primary text-xl mr-3" />
          <div>
            <div className="text-lg font-semibold">{property.area} m²</div>
            <div className="text-xs text-gray-500">Diện tích</div>
          </div>
        </div>
        
        <div className="flex items-center bg-gray-50 p-3 rounded-lg">
          <div className="bg-primary rounded-full p-1 text-white text-xl mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold">{property.direction || 'N/A'}</div>
            <div className="text-xs text-gray-500">Hướng nhà</div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {property.propertyStatus}
        </span>
        {property.projectName && (
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            {property.projectName}
          </span>
        )}
        {property.legalStatus && (
          <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            {property.legalStatus}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
        <div className="flex items-center">
          <FaCalendarAlt className="mr-1" />
          <span>Đăng ngày: {new Date(property.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="flex items-center">
          <FaEye className="mr-1" />
          <span>{property.views || 0} lượt xem</span>
        </div>
        <div className="flex gap-3 ml-auto">
          <button className="p-2 hover:text-primary transition">
            <FaShareAlt />
          </button>
          <button className="p-2 hover:text-primary transition">
            <FaHeart />
          </button>
          <button className="p-2 hover:text-primary transition">
            <FaFlag />
          </button>
        </div>
      </div>
    </div>
  );
};

interface PropertyDescriptionProps {
  description: string;
}

const PropertyDescription: React.FC<PropertyDescriptionProps> = ({ description }) => {
  const formattedDescription = transformSunEditorHtml(description || '');
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Mô tả chi tiết</h2>
      <div 
        className="property-description text-gray-700"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
      />
      
      <style jsx global>{`
        .property-description :global(img) {
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          max-width: 100%;
          height: auto;
        }
        
        .property-description :global(h2) {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        
        .property-description :global(h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #374151;
        }
        
        .property-description :global(p) {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        .property-description :global(ul) {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        .property-description :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

interface PropertyFeaturesProps {
  property: IPropertyPost;
}

const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ property }) => {
  const amenities = property.amenities || [];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Tiện ích</h2>
      
      {amenities.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {amenities.map((amenity, index) => (
            <div key={index} className="flex items-center">
              <svg className="text-primary w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{amenity}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Chưa có thông tin về tiện ích.</p>
      )}
    </div>
  );
};

interface PropertyLocationProps {
  address: string;
  coordinates?: number[];
  iframe?: string;
}

const PropertyLocation: React.FC<PropertyLocationProps> = ({ address, coordinates, iframe }) => {
  // Format full address
  const getFullAddress = () => {
    return address || 'Đang cập nhật địa chỉ';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
      
      <div className="mb-4">
        <div className="flex items-start">
          <FaMapMarkerAlt className="text-primary mt-1 mr-2" />
          <span className="text-gray-700">{getFullAddress()}</span>
        </div>
      </div>
      
      <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
        {iframe ? (
          <div dangerouslySetInnerHTML={{ __html: iframe }} className="w-full h-full" />
        ) : coordinates ? (
          <iframe 
            src={`https://maps.google.com/maps?q=${coordinates[1]},${coordinates[0]}&z=15&output=embed`}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Chưa có thông tin bản đồ
          </div>
        )}
      </div>
    </div>
  );
};

interface PropertyContactCardProps {
  contactName: string;
  contactPhone: string;
  price: number;
  priceUnit?: string;
}

const PropertyContactCard: React.FC<PropertyContactCardProps> = ({ 
  contactName, 
  contactPhone,
  price,
  priceUnit
}) => {
  const formatPrice = (price: number, unit?: string) => {
    if (!price) return 'Liên hệ';
    const formatter = new Intl.NumberFormat('vi-VN');
    return `${formatter.format(price)} ${unit || 'VNĐ'}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mr-3">
          <FaUser className="text-xl" />
        </div>
        <div>
          <h3 className="font-semibold">{contactName}</h3>
          <p className="text-sm text-gray-500">Người đăng bài</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between pb-2 border-b border-gray-200">
          <span className="text-gray-600">Giá:</span>
          <span className="font-semibold text-primary">{formatPrice(price, priceUnit)}</span>
        </div>
      </div>
      
      {contactPhone && (
        <a 
          href={`tel:${contactPhone}`} 
          className="block w-full bg-primary hover:bg-primary/90 text-white text-center py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 mb-4"
        >
          <FaPhone />
          <span>{contactPhone}</span>
        </a>
      )}
      
      <a 
        href="#" 
        className="block w-full bg-gray-800 hover:bg-gray-700 text-white text-center py-3 px-4 rounded-lg transition"
      >
        Nhắn tin
      </a>
    </div>
  );
};

export default DetailPropertyPost;
