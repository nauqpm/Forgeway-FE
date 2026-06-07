import React, { useState } from 'react';
import { X } from 'lucide-react';
import { parseTimeToMinutes } from '@/utils/timeTracking';

interface LogWorkModalProps {
  onClose: () => void;
  onSave: (minutes: number, description: string) => void;
}

const inputCls = "w-full p-2.5 border border-[#EAEAEA] dark:border-white/10 bg-[#F9F9F8] dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#2A2A2A] rounded-[6px] text-[13px] outline-none transition-colors";

export default function LogWorkModal({ onClose, onSave }: LogWorkModalProps) {
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const minutes = parseTimeToMinutes(timeSpent);
    if (minutes <= 0) {
      setError('Please enter a valid time (e.g., 2h 30m, 1d)');
      return;
    }
    onSave(minutes, description);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] rounded-[10px] border border-[#EAEAEA] dark:border-white/8"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/8">
          <h2 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Log work</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#787774] dark:text-[#9B9A97]">Time spent <span className="text-[#9F2F2D]">*</span></label>
            <input
              type="text"
              value={timeSpent}
              onChange={(e) => {
                setTimeSpent(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. 1w 2d 4h 30m"
              className={inputCls}
              autoFocus
            />
            {error && <p className="text-[11px] text-[#9F2F2D] mt-1">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#787774] dark:text-[#9B9A97]">Work description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className={`${inputCls} min-h-[100px] resize-y`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[#EAEAEA] dark:border-white/8">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#EAEAEA] dark:border-white/10 text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[13px] font-medium hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
