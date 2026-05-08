import React, { useState } from 'react';
import { useAdminAmenities } from '../hooks/useAdminAmenities';
import { IAmenity } from '../models/amenity.model';
import AmenityModal from './AmenityModal';

const AmenityList: React.FC = () => {
  const {
    amenities,
    loading,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    initializeAmenities
  } = useAdminAmenities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<IAmenity | null>(null);

  const handleCreate = () => {
    setSelectedAmenity(null);
    setIsModalOpen(true);
  };

  const handleEdit = (amenity: IAmenity) => {
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tiện ích này?')) {
      await deleteAmenity(id);
    }
  };

  const handleInitialize = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khởi tạo danh sách tiện ích mặc định?')) {
      await initializeAmenities();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Quản lý tiện ích</h1>
        <div className="space-x-2">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Thêm tiện ích
          </button>
          <button
            onClick={handleInitialize}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Khởi tạo mặc định
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên tiện ích
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amenities.map((amenity) => (
                <tr key={amenity._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {amenity.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        amenity.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {amenity.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(amenity.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(amenity)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(amenity._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AmenityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amenity={selectedAmenity}
        onSubmit={async (data) => {
          if (selectedAmenity) {
            await updateAmenity(selectedAmenity._id, data);
          } else {
            await createAmenity(data);
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default AmenityList; 