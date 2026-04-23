import React, { useState } from 'react';
import { PropertyFilters } from './PropertyFilters';
import { PropertyPagination } from './PropertyPagination';
import { useAdminProperties } from '../hooks/useAdminProperties';
import { PostApprovalStatus } from '../../../client/post-property/models/property.model';
import { PropertyList } from './PropertyList';


export const PropertyManagement: React.FC = () => {
  const {
    properties,
    loading,
    pagination,
    params,
    updateParams,
    approveProperty,
    deleteProperty,
    toggleHighlight,
  } = useAdminProperties();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<{
    id: string;
    status: PostApprovalStatus;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    description: string;
  }>({ show: false, type: 'success', title: '', description: '' });

  const showToast = (type: 'success' | 'error', title: string, description: string) => {
    setToast({ show: true, type, title, description });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleApprove = async (id: string, status: PostApprovalStatus) => {
    if (status === PostApprovalStatus.REJECTED) {
      setSelectedProperty({ id, status });
      setIsModalOpen(true);
    } else {
      await approveProperty(id, { approvalStatus: status });
    }
  };

  const handleConfirmReject = async () => {
    if (selectedProperty) {
      await approveProperty(selectedProperty.id, {
        approvalStatus: selectedProperty.status,
        rejectionReason,
      });
      setIsModalOpen(false);
      setRejectionReason('');
      setSelectedProperty(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty(id);
      showToast('success', 'Thành công', 'Đã xóa bài đăng');
    } catch (error) {
      showToast('error', 'Lỗi', 'Không thể xóa bài đăng');
    }
  };

  const handleHighlight = async (id: string) => {
    try {
      await toggleHighlight(id);
    } catch (error) {
      showToast('error', 'Lỗi', 'Không thể thay đổi trạng thái nổi bật');
    }
  };

  const handleReset = () => {
    updateParams({
      search: '',
      approvalStatus: undefined,
      sort: undefined,
      page: 1,
    });
  };

  return (
    <div className="p-4">
      {/* Toast notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white transition-all ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="font-bold">{toast.title}</div>
          <div>{toast.description}</div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Quản lý bài đăng</h1>

        <PropertyFilters
          params={params}
          onParamsChange={updateParams}
          onReset={handleReset}
        />

        <PropertyList
          properties={properties}
          onApprove={handleApprove}
          onDelete={handleDelete}
          onHighlight={handleHighlight}
          loading={loading}
        />

        <PropertyPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={(page) => updateParams({ page })}
          onLimitChange={(limit) => updateParams({ limit, page: 1 })}
        />
      </div>

      {/* Modal for rejection reason */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Lý do từ chối</h2>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Vui lòng nhập lý do từ chối bài đăng
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={4}
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                onClick={() => {
                  setIsModalOpen(false);
                  setRejectionReason('');
                  setSelectedProperty(null);
                }}
              >
                Hủy
              </button>
              <button
                className={`px-4 py-2 rounded text-white transition ${
                  !rejectionReason.trim()
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};