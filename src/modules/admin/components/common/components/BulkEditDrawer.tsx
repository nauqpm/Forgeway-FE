import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import CustomDatePicker from '../../../../../common/components/CustomDatePicker';

export const KEEP_AS_IS = 'KEEP_AS_IS';

interface BulkEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  uniqueAssignees: string[];
  onSubmit: (payload: any) => void;
}

export default function BulkEditDrawer({ isOpen, onClose, selectedCount, uniqueAssignees, onSubmit }: BulkEditDrawerProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    status: KEEP_AS_IS,
    priority: KEEP_AS_IS,
    assignee: KEEP_AS_IS,
    dueDate: KEEP_AS_IS,
  });

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      setFormData({
        status: KEEP_AS_IS,
        priority: KEEP_AS_IS,
        assignee: KEEP_AS_IS,
        dueDate: KEEP_AS_IS,
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: KEEP_AS_IS }));
  };

  const handleSubmit = () => {
    const payload: Record<string, string> = {};
    let hasChanges = false;
    Object.keys(formData).forEach(key => {
      if (formData[key] !== KEEP_AS_IS) {
        payload[key] = formData[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      alert("You have not changed any fields.");
      return;
    }

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="app-drawer fixed inset-y-0 right-0 bg-white dark:bg-gray-900 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Bulk edit tasks ({selectedCount})</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Fields set to "Keep unchanged" will not be changed when updating.</p>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <div className="flex gap-2">
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
          <div className="flex gap-2">
            <select
              value={formData.priority}
              onChange={e => handleChange('priority', e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
              <option value="Highest">Highest</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Lowest">Lowest</option>
            </select>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
          <div className="flex gap-2">
            <select
              value={formData.assignee}
              onChange={e => handleChange('assignee', e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
              <option value="Unassigned">Unassigned</option>
              {uniqueAssignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
          <div className="flex gap-2">
            <CustomDatePicker
              value={formData.dueDate === KEEP_AS_IS ? null : formData.dueDate}
              onChange={nextValue => handleChange('dueDate', nextValue ?? KEEP_AS_IS)}
              placeholder="Keep unchanged"
              className="flex-1"
              inputClassName="h-10 rounded-lg dark:bg-gray-800"
              ariaLabel="Bulk edit due date"
            />
            {formData.dueDate !== KEEP_AS_IS && (
              <button onClick={() => handleClear('dueDate')} className="px-2 text-sm text-red-500 hover:underline">Clear</button>
            )}
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
          Update ({selectedCount})
        </button>
      </div>
    </div>
  );
}
