import React, { useEffect, useState } from 'react';
import { X, CheckSquare, Trash2, Edit2, ChevronUp } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
}

export default function BulkActionBar({ selectedCount, onClear, onChangeStatus, onDelete }: BulkActionBarProps) {
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
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-4 border border-gray-700">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
          <div className="bg-indigo-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shadow-inner">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-gray-300">đã chọn</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
            Đổi trạng thái
            <ChevronUp className="w-3 h-3 text-gray-500 ml-1" />
          </button>

          {showStatusMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2">
              {['To Do', 'In Progress', 'Done'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    onChangeStatus(status);
                    setShowStatusMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={onDelete}
            className="flex items-center gap-2 hover:bg-red-900/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>

        <button 
          onClick={onClear}
          className="ml-2 p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Bỏ chọn (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
