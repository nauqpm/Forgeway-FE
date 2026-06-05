import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const KEEP_AS_IS = 'KEEP_AS_IS';

interface BulkEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  uniqueAssignees: string[];
  onSubmit: (payload: any) => void;
}

const selectCls = "flex-1 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] px-3 py-2 text-[13px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors";
const labelCls = "block text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] mb-1";

export default function BulkEditDrawer({ isOpen, onClose, selectedCount, uniqueAssignees, onSubmit }: BulkEditDrawerProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    status: KEEP_AS_IS,
    priority: KEEP_AS_IS,
    assignee: KEEP_AS_IS,
    dueDate: KEEP_AS_IS,
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        status: KEEP_AS_IS,
        priority: KEEP_AS_IS,
        assignee: KEEP_AS_IS,
        dueDate: KEEP_AS_IS,
      });
    }
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
    <div
      className="fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-[#202020] border-l border-[#EAEAEA] dark:border-white/8 z-50 flex flex-col transition-transform duration-300"
      style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.08), -1px 0 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#EAEAEA] dark:border-white/8">
        <h2 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Bulk edit tasks ({selectedCount})</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <p className="text-[13px] text-[#787774] dark:text-[#9B9A97]">Fields set to "Keep unchanged" will not be changed when updating.</p>

        <div>
          <label className={labelCls}>Status</label>
          <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className={selectCls}>
            <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Priority</label>
          <select value={formData.priority} onChange={e => handleChange('priority', e.target.value)} className={selectCls}>
            <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
            <option value="Highest">Highest</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Lowest">Lowest</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Assignee</label>
          <select value={formData.assignee} onChange={e => handleChange('assignee', e.target.value)} className={selectCls}>
            <option value={KEEP_AS_IS}>-- Keep unchanged --</option>
            <option value="Unassigned">Unassigned</option>
            {uniqueAssignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Due Date</label>
          <div className="flex gap-2">
            <input
              type={formData.dueDate === KEEP_AS_IS ? "text" : "date"}
              value={formData.dueDate === KEEP_AS_IS ? "-- Keep unchanged --" : formData.dueDate}
              onChange={e => handleChange('dueDate', e.target.value)}
              onFocus={(e) => {
                if (formData.dueDate === KEEP_AS_IS) {
                  e.target.type = 'date';
                  e.target.showPicker && e.target.showPicker();
                }
              }}
              className={selectCls}
            />
            {formData.dueDate !== KEEP_AS_IS && (
              <button onClick={() => handleClear('dueDate')} className="px-2 text-[13px] text-[#9F2F2D] hover:underline">Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#EAEAEA] dark:border-white/8 bg-[#F9F9F8] dark:bg-[#252525] flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] border border-[#EAEAEA] dark:border-white/10 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-[13px] font-medium text-white bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] rounded-[6px] transition-colors">
          Update ({selectedCount})
        </button>
      </div>
    </div>
  );
}
