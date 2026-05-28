import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";

interface StartSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  sprint: any;
}

export default function StartSprintModal({ isOpen, onClose, onConfirm, sprint }: StartSprintModalProps) {
  const [formData, setFormData] = useState({
    duration: '2 weeks',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (isOpen && sprint) {
      const start = sprint.startDate ? sprint.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
      let end = '';
      if (sprint.endDate) {
        end = sprint.endDate.split('T')[0];
      } else {
        const endDateObj = new Date(start);
        endDateObj.setDate(endDateObj.getDate() + 14); // default 2 weeks
        end = endDateObj.toISOString().split('T')[0];
      }

      setFormData({
        duration: sprint.duration || '2 weeks',
        startDate: start,
        endDate: end
      });
    }
  }, [isOpen, sprint]);

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
    if (!startStr) return;
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
    if (!formData.startDate || !formData.endDate) {
      toast.error("Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    onConfirm(
      new Date(formData.startDate).toISOString(),
      new Date(formData.endDate).toISOString()
    );
    onClose();
  };

  if (!isOpen || !sprint) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            Bắt đầu Sprint: {sprint.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Vui lòng xác nhận thời gian chạy cho sprint này trước khi kích hoạt.
            </p>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày kết thúc <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value, duration: 'custom' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              Bắt đầu Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
