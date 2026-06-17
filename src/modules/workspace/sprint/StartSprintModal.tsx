import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from "react-hot-toast";

interface StartSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sprint: any;
}

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors";
const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";

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
        endDateObj.setDate(endDateObj.getDate() + 14);
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
    if (days > 0) end.setDate(start.getDate() + days);

    setFormData({
      ...formData,
      startDate: startStr,
      endDate: days > 0 ? end.toISOString().split('T')[0] : formData.endDate
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please enter both the start and end dates");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("The end date must be after the start date");
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-lg border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Start Sprint: {sprint.name}
          </h3>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            Confirm the sprint schedule before starting it.
          </p>
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
              <label className={labelCls}>Start date <span className="text-[#9F2F2D]">*</span></label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={handleStartDateChange}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End date <span className="text-[#9F2F2D]">*</span></label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value, duration: 'custom' })}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors">
              Start sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
