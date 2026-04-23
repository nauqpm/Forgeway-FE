"use client";

import React, { useEffect, useState } from "react";

import { toast } from "react-hot-toast";
import { useImages } from "@/common/hooks/useImages";
import { useAuth } from "@/context/AuthContext";
import { IPropertyPostCreate, PostVisibility, PropertyStatus, HouseDirection } from "../models/property.model";
import { usePropertyPost } from "../hooks/usePropertyPost";
import { useAmenities } from '../hooks/useAmenities';
import ImageUpload from "./ImageUpload";
import PropertyLocation from "./PropertyLocation";
import SunEditer from "../../common/components/SunEditer";

interface PropertyPostFormProps {
  initialValues?: Partial<IPropertyPostCreate>;
  slug?: string;
  onSuccess?: () => void;
}

// Chuyển tiếng Việt có dấu sang không dấu và thay khoảng trắng bằng dấu gạch ngang
const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/ /g, '-')
};

const generateSlug = (title: string) => {
  if (!title) return '';

  const noTone = removeVietnameseTones(title);
  return noTone
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
    .replace(/-+/g, '-'); // Replace multiple - with single -
};

const PropertyPostForm: React.FC<PropertyPostFormProps> = ({
  initialValues,
  slug,
  onSuccess,
}) => {
  const { createPropertyPost, updatePropertyPost, loading } = usePropertyPost();
  const { uploadImage, uploadMultipleImages } = useImages();
  const { user } = useAuth();
  const { amenities: availableAmenities, loading: loadingAmenities } = useAmenities();
  const [formData, setFormData] = useState<Partial<IPropertyPostCreate>>({
    slug: generateSlug(initialValues?.title || ""),
    title: "",
    price: 0,
    area: 0,
    description: "",
    propertyStatus: PropertyStatus.AVAILABLE,
    visibility: PostVisibility.PUBLIC,
    thumbnailUrl: "",
    albumUrls: [],
    direction: "",
    numberOfBedrooms: 0,
    numberOfBathrooms: 0,
    amenities: [],
    ...initialValues,
  });

  const [newAmenity, setNewAmenity] = useState("");
  // Remove hardcoded commonAmenities array since we're using the API now

  // Remove useEffect for author update since we don't need it anymore

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [albumFiles, setAlbumFiles] = useState<(File | string)[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
      if (initialValues.albumUrls) {
        setAlbumFiles(initialValues.albumUrls);
      }
    }
  }, [initialValues]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Convert numeric fields to numbers
    let processedValue: string | number = value;
    if (['price', 'area', 'numberOfBedrooms', 'numberOfBathrooms', 'numberOfFloors', 'yearBuilt', 'frontageWidth', 'roadWidth'].includes(name)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (isNaN(numValue)) {
        setErrors(prev => ({ ...prev, [name]: 'Giá trị phải là số' }));
        return;
      }
      if (numValue < 0) {
        setErrors(prev => ({ ...prev, [name]: 'Giá trị không được nhỏ hơn 0' }));
        return;
      }
      processedValue = numValue;
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: processedValue,
      };

      // Auto-generate slug when title changes
      if (name === 'title') {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const handleLocationChange = (locationData: {
    address: string;
    ward: string;
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    iframe: string;
  }) => {
    console.log('Location data received:', locationData);
    console.log('Iframe data received:', locationData.iframe); // Add this line to debug iframe data
    setFormData(prev => {
      const newData = {
        ...prev,
        address: locationData.address,
        ward: locationData.ward,
        district: locationData.district,
        city: locationData.city,
        iframe: locationData.iframe,
        location: {
          type: {
            type: 'Point',
            coordinates: [locationData.longitude, locationData.latitude]
          }
        }
      };
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để đăng tin");
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      // Start with current thumbnailUrl from formData or empty string
      let thumbnailUrl = formData.thumbnailUrl || '';
      let albumUrls: string[] = [];

      // Upload thumbnail if a new file is selected
      if (thumbnailFile) {
        try {
          const thumbnailResult = await uploadImage(thumbnailFile);
          if (thumbnailResult?.url) {
            thumbnailUrl = thumbnailResult.url;
          } else if (thumbnailResult?.imageUrl) {
            thumbnailUrl = thumbnailResult.imageUrl;
          } else if (thumbnailResult?.path) {
            thumbnailUrl = thumbnailResult.path;
          } else {
            toast.error("Không thể lấy đường dẫn ảnh đại diện");
            return;
          }
        } catch (error) {
          toast.error('Lỗi khi tải lên ảnh đại diện');
          return;
        }
      }

      // Upload album images if new files are selected
      const newAlbumFiles = albumFiles.filter(file => file instanceof File) as File[];
      const existingAlbumUrls = albumFiles.filter(file => typeof file === 'string') as string[];

      if (newAlbumFiles.length > 0) {
        try {
          const albumResults = await uploadMultipleImages(newAlbumFiles);
          const newAlbumUrls = albumResults
            .map(result => result.url || result.imageUrl || result.path)
            .filter(url => url) as string[];
          albumUrls = [...existingAlbumUrls, ...newAlbumUrls];
        } catch (error) {
          toast.error('Lỗi khi tải lên album ảnh');
          return;
        }
      } else {
        albumUrls = existingAlbumUrls;
      }

      // Prepare data for submission
      const dataToSubmit: IPropertyPostCreate = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || ""),
        title: formData.title || "",
        price: Number(formData.price) || 0,
        area: Number(formData.area) || 0,
        description: formData.description || "",
        propertyStatus: formData.propertyStatus || PropertyStatus.AVAILABLE,
        visibility: formData.visibility || PostVisibility.PUBLIC,
        thumbnailUrl,
        albumUrls,
        direction: formData.direction as HouseDirection || "",
        numberOfBedrooms: Number(formData.numberOfBedrooms) || 0,
        numberOfBathrooms: Number(formData.numberOfBathrooms) || 0,
        amenities: formData.amenities || [],
        address: formData.address || "",
        ward: formData.ward || "",
        district: formData.district || "",
        city: formData.city || "",
        iframe: formData.iframe,
        location: formData.location,
        numberOfFloors: formData.numberOfFloors ? Number(formData.numberOfFloors) : undefined,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
        frontageWidth: formData.frontageWidth ? Number(formData.frontageWidth) : undefined,
        roadWidth: formData.roadWidth ? Number(formData.roadWidth) : undefined,
      } as IPropertyPostCreate;

      if (slug) {
        await updatePropertyPost(slug, dataToSubmit);
        toast.success("Cập nhật dự án thành công");
      } else {
        await createPropertyPost(dataToSubmit);
        toast.success("Tạo dự án mới thành công");
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gửi form");
    }
  };

  // Handle thumbnail upload separately to update formData immediately
  const handleThumbnailSelected = (file: File | null) => {
    setThumbnailFile(file);
    // Clear the error if a file is selected
    if (file) {
      setErrors(prev => ({ ...prev, thumbnailUrl: '' }));
    }
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...(prev.amenities || []), newAmenity.trim()]
      }));
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.filter((_, i) => i !== index)
    }));
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(amenity)) {
        return {
          ...prev,
          amenities: currentAmenities.filter(a => a !== amenity)
        };
      } else {
        return {
          ...prev,
          amenities: [...currentAmenities, amenity]
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Giá phải lớn hơn 0";
    }

    if (!formData.area || formData.area <= 0) {
      newErrors.area = "Diện tích phải lớn hơn 0";
    }

    if (!formData.thumbnailUrl && !thumbnailFile) {
      newErrors.thumbnailUrl = "Hình ảnh đại diện là bắt buộc";
    }

    // Validate location fields
    if (!formData.address?.trim()) {
      newErrors.address = "Địa chỉ là bắt buộc";
    }
    if (!formData.ward?.trim()) {
      newErrors.ward = "Phường/Xã là bắt buộc";
    }
    if (!formData.district?.trim()) {
      newErrors.district = "Quận/Huyện là bắt buộc";
    }
    if (!formData.city?.trim()) {
      newErrors.city = "Tỉnh/Thành phố là bắt buộc";
    }

    // Validate numeric fields
    const numericFields = ['numberOfBedrooms', 'numberOfBathrooms', 'numberOfFloors', 'yearBuilt', 'frontageWidth', 'roadWidth'];
    numericFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number') {
          newErrors[field] = 'Giá trị phải là số';
        } else if (value < 0) {
          newErrors[field] = 'Giá trị không được nhỏ hơn 0';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Hình ảnh dự án */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Hình ảnh dự án</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh đại diện <span className="text-red-500">*</span>
            </label>
            <ImageUpload
              imageUrl={formData.thumbnailUrl}
              onImageSelected={handleThumbnailSelected}
              aspectRatio={16 / 9}
            />
            {errors.thumbnailUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.thumbnailUrl}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Album hình ảnh
            </label>
            <ImageUpload
              multiple
              imageUrl={formData.albumUrls}
              onImagesSelected={setAlbumFiles}
              maxCount={10}
            />
          </div>
        </div>
      </div>

      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Nhập tiêu đề dự án"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
              placeholder="Slug sẽ được tạo tự động từ tiêu đề"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Slug được tạo tự động từ tiêu đề và sẽ được sử dụng trong URL</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Nhập giá"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diện tích (m²) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              required
              min="0"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Nhập diện tích"
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-500">{errors.area}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <SunEditer postData={formData.description || ""} setPostData={(value) => handleInputChange({ target: { name: "description", value } } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)} />
            {/* <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập mô tả chi tiết về dự án"
            /> */}
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin chi tiết</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hướng nhà
            </label>
            <select
              name="direction"
              value={formData.direction || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn hướng nhà</option>
              {Object.entries(HouseDirection).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số phòng ngủ
            </label>
            <input
              type="number"
              name="numberOfBedrooms"
              value={formData.numberOfBedrooms || 0}
              onChange={handleInputChange}
              min="0"
              step="1"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.numberOfBedrooms ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập số phòng ngủ"
            />
            {errors.numberOfBedrooms && (
              <p className="mt-1 text-sm text-red-500">{errors.numberOfBedrooms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số phòng tắm
            </label>
            <input
              type="number"
              name="numberOfBathrooms"
              value={formData.numberOfBathrooms || 0}
              onChange={handleInputChange}
              min="0"
              step="1"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.numberOfBathrooms ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập số phòng tắm"
            />
            {errors.numberOfBathrooms && (
              <p className="mt-1 text-sm text-red-500">{errors.numberOfBathrooms}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tiện ích */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tiện ích</h2>
        
        {/* Available amenities */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiện ích có sẵn
          </label>
          {loadingAmenities ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableAmenities.map((amenity) => (
                <div key={amenity._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity._id}`}
                    checked={formData.amenities?.includes(amenity.name)}
                    onChange={() => handleToggleAmenity(amenity.name)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`amenity-${amenity._id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {amenity.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom amenities section remains the same */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thêm tiện ích khác
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tiện ích mới"
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Thêm
            </button>
          </div>

          {/* Custom amenities list remains the same */}
          {formData.amenities && formData.amenities.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiện ích đã thêm
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.filter(amenity => !availableAmenities.some(a => a.name === amenity)).map((amenity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(index)}
                      className="ml-2 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vị trí */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
        <PropertyLocation
          initialValues={initialValues}
          onChange={handleLocationChange}
        />
      </div>

      {/* Trạng thái */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Trạng thái</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              name="propertyStatus"
              value={formData.propertyStatus}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={PropertyStatus.AVAILABLE}>Còn trống</option>
              <option value={PropertyStatus.SOLD}>Đã bán</option>
              <option value={PropertyStatus.RENTED}>Đã cho thuê</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hiển thị <span className="text-red-500">*</span>
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={PostVisibility.PUBLIC}>Công khai</option>
              <option value={PostVisibility.PRIVATE}>Riêng tư</option>
              <option value={PostVisibility.DRAFT}>Bản nháp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang xử lý...
          </span>
        ) : slug ? (
          "Cập nhật"
        ) : (
          "Đăng tin"
        )}
      </button>
    </form>
  );
};

export default PropertyPostForm;
