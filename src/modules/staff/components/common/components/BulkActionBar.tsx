import React, { useEffect, useState } from 'react';
import { X, CheckSquare, Trash2, Edit2, ChevronUp } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onChangeStatus: (status: string) => void;
  onEditFields?: () => void;
  onDelete: () => void;
}

export default function BulkActionBar({ selectedCount, onClear, onChangeStatus, onEditFields, onDelete }: BulkActionBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCount > 0) {
        onClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClear]);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div
        className="bg-[#202020] text-[#E8E8E7] rounded-[10px] px-4 py-3 flex items-center gap-4 border border-white/8"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-2 pr-4 border-r border-white/8">
          <div className="bg-[#2563EB] w-6 h-6 rounded-[4px] flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-[#9B9A97]">selected</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-2 hover:bg-white/8 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[#3B82F6]" />
            Change status
            <ChevronUp className="w-3 h-3 text-[#6B6B6B] ml-1" />
          </button>

          {showStatusMenu && (
            <div
              className="absolute bottom-full mb-2 left-0 w-40 bg-[#202020] border border-white/8 rounded-[8px] overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
            >
              {['To Do', 'In Progress', 'Done'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    onChangeStatus(status);
                    setShowStatusMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#9B9A97] hover:bg-white/8 hover:text-[#E8E8E7] transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {onEditFields && (
            <button 
              onClick={onEditFields}
              className="flex items-center gap-2 hover:bg-white/8 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors text-[#9B9A97] hover:text-[#E8E8E7]"
            >
              <Edit2 className="w-4 h-4" />
              Edit fields
            </button>
          )}

          <button 
            onClick={onDelete}
            className="flex items-center gap-2 hover:bg-[rgba(159,47,45,0.12)] text-[#F87171] hover:text-[#FCA5A5] px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <button 
          onClick={onClear}
          className="ml-2 p-1.5 hover:bg-white/8 rounded-[6px] text-[#6B6B6B] hover:text-[#E8E8E7] transition-colors"
          title="Deselect (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
