import React, { useState } from 'react';
import { X } from 'lucide-react';
import { parseTimeToMinutes } from '@/utils/timeTracking';

interface LogWorkModalProps {
  onClose: () => void;
  onSave: (minutes: number, description: string) => void;
}

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
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-900 text-[#172B4D] dark:text-white rounded-xl shadow-2xl border border-[#DFE1E6] dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#DFE1E6] dark:border-gray-700">
          <h2 className="text-xl font-semibold text-[#172B4D] dark:text-white">Log work</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#EBECF0] dark:hover:bg-gray-700 rounded-md text-[#5E6C84] dark:text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#5E6C84] dark:text-gray-400">Time spent <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={timeSpent}
              onChange={(e) => {
                setTimeSpent(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. 1w 2d 4h 30m"
              className="w-full p-2 bg-[#F4F5F7] dark:bg-gray-800 dark:text-white border-2 border-transparent focus:border-[#0052CC] focus:bg-white dark:focus:bg-gray-900 rounded transition-colors outline-none text-sm"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#5E6C84] dark:text-gray-400">Work description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full min-h-[100px] p-2 bg-[#F4F5F7] dark:bg-gray-800 dark:text-white border-2 border-transparent focus:border-[#0052CC] focus:bg-white dark:focus:bg-gray-900 rounded transition-colors outline-none resize-y text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[#DFE1E6] dark:border-gray-700">
          <button 
            onClick={onClose} 
            className="px-4 py-2 hover:bg-[#EBECF0] dark:hover:bg-gray-700 text-[#172B4D] dark:text-white text-sm font-medium rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-medium rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
