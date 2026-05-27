import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprint: any) => void;
  initialData?: any;
  sprintCount?: number;
}

export default function SprintModal({ isOpen, onClose, onSave, initialData, sprintCount = 0 }: SprintModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    duration: '2 weeks',
    startDate: '',
    endDate: '',
    goal: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          duration: initialData.duration || '2 weeks',
          startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
          endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
          goal: initialData.goal || ''
        });
      } else {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 14); // 2 weeks
        
        setFormData({
          name: `Sprint ${sprintCount + 1}`,
          duration: '2 weeks',
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          goal: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dur = e.target.value;
    if (dur === 'custom') {
      setFormData({
        ...formData,
        duration: dur,
      });
      return;
    }

    let days = 0;
    if (dur === '1 week') days = 7;
    if (dur === '2 weeks') days = 14;
    if (dur === '3 weeks') days = 21;
    if (dur === '4 weeks') days = 28;

    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start);
    if (days > 0) {
      end.setDate(start.getDate() + days);
    }

    setFormData({
      ...formData,
      duration: dur,
      startDate: start.toISOString().split('T')[0],
      endDate: days > 0 ? end.toISOString().split('T')[0] : formData.endDate
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startStr = e.target.value;
    const start = new Date(startStr);
    
    let days = 0;
    if (formData.duration === '1 week') days = 7;
    if (formData.duration === '2 weeks') days = 14;
    if (formData.duration === '3 weeks') days = 21;
    if (formData.duration === '4 weeks') days = 28;

    const end = new Date(start);
    if (days > 0) {
      end.setDate(start.getDate() + days);
    }

    setFormData({
      ...formData,
      startDate: startStr,
      endDate: days > 0 ? end.toISOString().split('T')[0] : formData.endDate
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((formData.startDate && !formData.endDate) || (!formData.startDate && formData.endDate)) {
      toast.error("Vui lòng nhập cả ngày bắt đầu và kết thúc, hoặc để trống cả hai");
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    
    const cleanData = {
      ...formData,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };
    
    // Only active sprints restrict date changes
    const isRestricted = initialData?.status === 'active';

    if (isRestricted) {
      onSave({ name: formData.name, goal: formData.goal });
    } else {
      onSave(cleanData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isRestricted = initialData?.status === 'active';

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {initialData ? 'Chỉnh sửa Sprint' : 'Tạo Sprint mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {initialData?.status === 'active' && (
          <div className="px-6 pt-4 pb-0">
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Sprint đang chạy — chỉ có thể sửa tên và mục tiêu.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên Sprint <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thời lượng (Duration)</label>
            <select
              value={formData.duration}
              onChange={handleDurationChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="3 weeks">3 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                disabled={isRestricted}
                value={formData.startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày kết thúc</label>
              <input
                type="date"
                disabled={isRestricted}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value, duration: 'custom' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mục tiêu Sprint (Goal)</label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              placeholder="Vd: Hoàn thiện tính năng thanh toán..."
            />
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              {initialData ? 'Cập nhật' : 'Tạo Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
