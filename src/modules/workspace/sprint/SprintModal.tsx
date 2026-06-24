import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";
import CustomDatePicker from '@/shared/components/CustomDatePicker';

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (sprint: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  sprintCount?: number;
}

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";

export default function SprintModal({ isOpen, onClose, onSave, initialData, sprintCount = 0 }: SprintModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    duration: '2 weeks',
    startDate: '',
    endDate: '',
    goal: ''
  });

  useEffect(() => {
    if (!isOpen) return;
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
      end.setDate(start.getDate() + 14);
      setFormData({
        name: `Sprint ${sprintCount + 1}`,
        duration: '2 weeks',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        goal: ''
      });
    }
    // Only initialize when the modal opens — do not re-run on parent re-renders
    // that create new initialData references (would reset in-progress user edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dur = e.target.value;
    if (dur === 'custom') {
      setFormData({ ...formData, duration: dur });
      return;
    }

    let days = 0;
    if (dur === '1 week') days = 7;
    if (dur === '2 weeks') days = 14;
    if (dur === '3 weeks') days = 21;
    if (dur === '4 weeks') days = 28;

    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start);
    if (days > 0) end.setDate(start.getDate() + days);

    setFormData({
      ...formData,
      duration: dur,
      startDate: start.toISOString().split('T')[0],
      endDate: days > 0 ? end.toISOString().split('T')[0] : formData.endDate
    });
  };

  const handleStartDateChange = (startStr: string | null) => {
    if (!startStr) {
      setFormData({ ...formData, startDate: '' });
      return;
    }
    const start = new Date(startStr);

    let days = 0;
    if (formData.duration === '1 week') days = 7;
    if (formData.duration === '2 weeks') days = 14;
    if (formData.duration === '3 weeks') days = 21;
    if (formData.duration === '4 weeks') days = 28;

    const end = new Date(start);
    if (days > 0) end.setDate(start.getDate() + days);

    setFormData({
      ...formData,
      startDate: startStr,
      endDate: days > 0 ? end.toISOString().split('T')[0] : formData.endDate
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((formData.startDate && !formData.endDate) || (!formData.startDate && formData.endDate)) {
      toast.error("Enter both start and end dates, or leave both empty");
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("The end date must be after the start date");
      return;
    }

    const cleanData = {
      ...formData,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-lg border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            {initialData ? 'Edit Sprint' : 'Create Sprint'}
          </h3>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {initialData?.status === 'active' && (
          <div className="px-5 pt-4 pb-0">
            <p className="text-[0.6875rem] text-[#956400] dark:text-[#F59E0B] bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.15)] border border-[#F0D88A] dark:border-[rgba(245,158,11,0.2)] rounded-[6px] px-3 py-2">
              Running sprints can only have their name and goal edited.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Sprint name <span className="text-[#9F2F2D]">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <select value={formData.duration} onChange={handleDurationChange} className={inputCls}>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="3 weeks">3 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Start date</label>
              <CustomDatePicker
                value={formData.startDate || null}
                onChange={handleStartDateChange}
                disabled={isRestricted}
                placeholder="DD/MM/YYYY"
                ariaLabel="Sprint start date"
              />
            </div>
            <div>
              <label className={labelCls}>End date</label>
              <CustomDatePicker
                value={formData.endDate || null}
                onChange={(val) => setFormData({ ...formData, endDate: val || '', duration: 'custom' })}
                disabled={isRestricted}
                placeholder="DD/MM/YYYY"
                ariaLabel="Sprint end date"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Sprint goal</label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Example: Complete payment feature..."
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors">
              {initialData ? 'Update' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
