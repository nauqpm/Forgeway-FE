import React, { useState, useRef, useEffect } from 'react';
import { IPropertyPost, PostApprovalStatus } from '../../../client/post-property/models/property.model';
import { UserService } from '../../../client/users/services/user.service';
import { IUser } from '../../../client/users/models/user.model';
import { transformSunEditorHtml } from '@/utils/transformSunEditorHtml';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';

interface PropertyListProps {
  properties: IPropertyPost[];
  onApprove: (id: string, status: PostApprovalStatus, reason?: string) => void;
  onDelete: (id: string) => void;
  onHighlight: (id: string) => void;
  loading?: boolean;
}

const statusBadgeClass: Record<PostApprovalStatus, string> = {
  [PostApprovalStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PostApprovalStatus.APPROVED]: 'bg-green-100 text-green-800',
  [PostApprovalStatus.REJECTED]: 'bg-red-100 text-red-800',
};

const statusText: Record<PostApprovalStatus, string> = {
  [PostApprovalStatus.PENDING]: 'Chờ duyệt',
  [PostApprovalStatus.APPROVED]: 'Đã duyệt',
  [PostApprovalStatus.REJECTED]: 'Từ chối',
};

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-400'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.564-.955L10 0l2.948 5.955 6.564.955-4.756 4.635 1.122 6.545z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 mr-2 text-green-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4 mr-2 text-red-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4 mr-2 text-red-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z" />
    </svg>
  );
}

interface PreviewModalProps {
  property: IPropertyPost | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, title }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const defaultImage = '/imgs/placeholder.jpg';
  const imageList = images.length > 0 ? images : [defaultImage];
  
  const handlePrevImage = () => {
    setActiveIndex((activeIndex - 1 + imageList.length) % imageList.length);
  };
  
  const handleNextImage = () => {
    setActiveIndex((activeIndex + 1) % imageList.length);
  };

  return (
    <div className="relative bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      {/* Main Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={imageList[activeIndex]}
          alt={`${title} - Ảnh ${activeIndex + 1}`}
          className="w-full h-full object-cover"
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
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
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
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
      
      <div className="mb-4">
        <div className="flex items-start">
          <FaMapMarkerAlt className="text-primary mt-1 mr-2" />
          <span className="text-gray-700">{address || 'Đang cập nhật địa chỉ'}</span>
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

const PreviewModal: React.FC<PreviewModalProps> = ({ property, onClose, onApprove, onReject }) => {
  if (!property) return null;

  const formatPrice = (price: number, unit?: string) => {
    if (!price) return 'Liên hệ';
    const formatter = new Intl.NumberFormat('vi-VN');
    return `${formatter.format(price)} ${unit || 'VNĐ'}`;
  };

  const getFullAddress = () => {
    const addressParts = [];
    if (property.address) addressParts.push(property.address);
    if (property.ward) addressParts.push(property.ward);
    if (property.district) addressParts.push(property.district);
    if (property.city) addressParts.push(property.city);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Đang cập nhật địa chỉ';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="h-[90vh] px-4 text-center">
        <div className="fixed inset-0" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="relative">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Xem trước bài đăng</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Gallery */}
              <PropertyGallery 
                images={property.albumUrls || []} 
                title={property.title}
              />

              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h1 className="text-lg font-bold text-gray-800 mb-1">{property.title}</h1>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FaMapMarkerAlt className="mr-2 text-primary" />
                      <span>{getFullAddress()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(property.price, property.priceUnit)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <FaRulerCombined className="inline mr-1" />
                      {property.area} m²
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <FaBed className="text-primary text-base mr-2" />
                    <div>
                      <div className="text-base font-semibold">{property.numberOfBedrooms || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Phòng ngủ</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <FaBath className="text-primary text-base mr-2" />
                    <div>
                      <div className="text-base font-semibold">{property.numberOfBathrooms || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Phòng tắm</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <FaRulerCombined className="text-primary text-base mr-2" />
                    <div>
                      <div className="text-base font-semibold">{property.area} m²</div>
                      <div className="text-xs text-gray-500">Diện tích</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <div className="bg-primary rounded-full p-1 text-white text-base mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-semibold">{property.direction || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Hướng nhà</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-base font-semibold mb-2">Mô tả chi tiết</h2>
                <div 
                  className="property-description text-gray-700 text-sm"
                  dangerouslySetInnerHTML={{ __html: transformSunEditorHtml(property.description || '') }}
                />
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h2 className="text-base font-semibold mb-2">Tiện ích</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="text-primary w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <PropertyLocation 
                address={getFullAddress()}
                coordinates={property.location?.type?.coordinates}
                iframe={property.iframe}
              />
            </div>

            {/* Footer Actions */}
            {property.approvalStatus === PostApprovalStatus.PENDING && (
              <div className="border-t p-4 flex justify-end gap-3">
                <button
                  onClick={onReject}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <CloseIcon />
                  Từ chối
                </button>
                <button
                  onClick={onApprove}
                  className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                >
                  <CheckIcon />
                  Duyệt bài
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onApprove,
  onDelete,
  onHighlight,
  loading = false,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [userDataMap, setUserDataMap] = useState<Record<string, IUser>>({});
  const [previewProperty, setPreviewProperty] = useState<IPropertyPost | null>(null);

  // Close menu when clicking outside
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuNode = menuRefs.current[openMenuId];
        if (menuNode && !menuNode.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleDelete = (id: string) => {
    setSelectedPropertyId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(selectedPropertyId);
    setShowDeleteModal(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleMenuClose = () => {
    setOpenMenuId(null);
  };

  const handlePreview = (property: IPropertyPost) => {
    setPreviewProperty(property);
    handleMenuClose();
  };

  const handleClosePreview = () => {
    setPreviewProperty(null);
  };

  const handleApproveFromPreview = () => {
    if (previewProperty?.slug) {
      onApprove(previewProperty.slug, PostApprovalStatus.APPROVED);
      handleClosePreview();
    }
  };

  const handleRejectFromPreview = () => {
    if (previewProperty?.slug) {
      onApprove(previewProperty.slug, PostApprovalStatus.REJECTED);
      handleClosePreview();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-md">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b text-left">Tiêu đề</th>
            <th className="px-4 py-2 border-b text-left">Người đăng</th>
            <th className="px-4 py-2 border-b text-left">Ngày đăng</th>
            <th className="px-4 py-2 border-b text-left">Trạng thái</th>
            <th className="px-4 py-2 border-b text-left">Nổi bật</th>
            <th className="px-4 py-2 border-b text-left">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => {
            // Generate a unique key
            const propertyKey = property._id || property.id || `property-${property.slug || property.title}-${Math.random()}`;
            const menuId = property._id || property.id || propertyKey;

            return (
            <tr key={propertyKey} className="hover:bg-gray-50">
              <td className="px-4 py-2 max-w-xs align-top">
                <div className="truncate" title={property.title}>{property.title}</div>
              </td>
              <td className="px-4 py-2 align-top">
                {(() => {
                  const authorId = typeof property.author === 'string' ? property.author : property.author?.id;
                  return authorId ? userDataMap[authorId]?.fullName || 'Đang tải...' : 'N/A';
                })()}
              </td>
              <td className="px-4 py-2 align-top">
                {new Date(property.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-2 align-top relative group">
                <div className="flex items-center">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      property.approvalStatus && statusBadgeClass[property.approvalStatus]
                    }`}
                  >
                    {property.approvalStatus && statusText[property.approvalStatus] || 'Không rõ'}
                  </span>
                  {(property.approvalStatus === PostApprovalStatus.PENDING || property.approvalStatus === PostApprovalStatus.APPROVED) && (
                    <div className="hidden group-hover:flex absolute left-full -ml-6 bg-white shadow-lg rounded-md p-1 z-10 min-w-[140px]">
                      <div className="flex flex-col space-y-1 w-full">
                        {property.approvalStatus === PostApprovalStatus.PENDING && (
                          <button
                            className="flex items-center px-3 py-1 text-sm text-green-700 hover:bg-green-50 rounded-md w-full"
                            onClick={() => {
                              const slug = property.slug;
                              if (slug) {
                                onApprove(slug, PostApprovalStatus.APPROVED);
                              }
                            }}
                            type="button"
                          >
                            <CheckIcon />
                            <span className="ml-1 whitespace-nowrap">Duyệt</span>
                          </button>
                        )}
                        <button
                          className="flex items-center px-3 py-1 text-sm text-red-700 hover:bg-red-50 rounded-md w-full"
                          onClick={() => {
                            const slug = property.slug;
                            if (slug) {
                              onApprove(slug, PostApprovalStatus.REJECTED);
                            }
                          }}
                          type="button"
                        >
                          <CloseIcon />
                          <span className="ml-1 whitespace-nowrap">Từ chối</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 align-top">
                <button
                  aria-label="Toggle highlight"
                  className={`p-2 rounded-full border ${property.isHighlight ? 'bg-yellow-100 border-yellow-300' : 'bg-gray-100 border-gray-300'} hover:shadow`}
                  onClick={() => {
                    const slug = property.slug;
                    if (slug) {
                      onHighlight(slug);
                    } else {
                      console.error("Property ID is undefined");
                      alert("Không thể cập nhật trạng thái nổi bật: ID không hợp lệ");
                    }
                  }}
                  type="button"
                >
                  <StarIcon filled={!!property.isHighlight} />
                </button>
              </td>
              <td className="px-4 py-2 align-top">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none"
                    onClick={() => handlePreview(property)}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Xem trước
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md bg-white hover:bg-red-50 text-red-600 focus:outline-none"
                    onClick={() => {
                      const slug = property.slug;
                      if (slug) {
                        handleDelete(slug);
                      }
                    }}
                    disabled={loading}
                  >
                    <DeleteIcon />
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
            <p className="mb-6">Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={closeDeleteModal}
                type="button"
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
                type="button"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewProperty && (
        <PreviewModal
          property={previewProperty}
          onClose={handleClosePreview}
          onApprove={handleApproveFromPreview}
          onReject={handleRejectFromPreview}
        />
      )}
    </div>
  );
};