import React from 'react';
import { PostApprovalStatus } from '../../../client/post-property/models/property.model';
import { IAdminPropertyListParams } from '../services/admin-property.service';

interface PropertyFiltersProps {
  params: IAdminPropertyListParams;
  onParamsChange: (params: Partial<IAdminPropertyListParams>) => void;
  onReset: () => void;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  params,
  onParamsChange,
  onReset,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as PostApprovalStatus | '';
    onParamsChange({
      approvalStatus: value || undefined,
      page: 1,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onParamsChange({ sort: e.target.value, page: 1 });
  };

  return (
    <div className="p-4 bg-white shadow-sm rounded-md">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Tìm kiếm</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm theo tiêu đề..."
            value={params.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={params.approvalStatus || ''}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value={PostApprovalStatus.PENDING}>Chờ duyệt</option>
            <option value={PostApprovalStatus.APPROVED}>Đã duyệt</option>
            <option value={PostApprovalStatus.REJECTED}>Từ chối</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Sắp xếp</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={params.sort || ''}
            onChange={handleSortChange}
          >
            <option value="">Sắp xếp theo</option>
            <option value="-createdAt">Mới nhất</option>
            <option value="createdAt">Cũ nhất</option>
            <option value="-updatedAt">Cập nhật gần đây</option>
            <option value="title">Tiêu đề (A-Z)</option>
            <option value="-title">Tiêu đề (Z-A)</option>
          </select>
        </div>

        <button
          type="button"
          className="h-10 px-4 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          onClick={onReset}
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};