import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, Edit2, ChevronUp, ArrowRightCircle } from 'lucide-react';

interface SprintOption {
  id: string;
  name: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  onEditFields?: () => void;
  sprints?: SprintOption[];
  onMoveSprint?: (sprintId: string | null) => void;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canMoveTask?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onChangeStatus,
  onDelete,
  onEditFields,
  sprints,
  onMoveSprint,
  canEditTask = true,
  canDeleteTask = true,
  canMoveTask = true,
}: BulkActionBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showSprintMenu, setShowSprintMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const sprintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCount > 0) onClear();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedCount, onClear]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusMenu(false);
      if (sprintRef.current && !sprintRef.current.contains(e.target as Node)) setShowSprintMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-gray-700">
        {/* Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
          <div className="bg-indigo-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shadow-inner">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-gray-300">đã chọn</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Status dropdown */}
          {canEditTask && (
          <div ref={statusRef} className="relative">
            <button
              onClick={() => { setShowStatusMenu(!showStatusMenu); setShowSprintMenu(false); }}
              className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
              Đổi trạng thái
              <ChevronUp className="w-3 h-3 text-gray-500 ml-1" />
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2">
                {['To Do', 'In Progress', 'Done'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { onChangeStatus(status); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Move to sprint dropdown */}
          {onMoveSprint && canMoveTask && (
            <div ref={sprintRef} className="relative">
              <button
                onClick={() => { setShowSprintMenu(!showSprintMenu); setShowStatusMenu(false); }}
                className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white"
              >
                <ArrowRightCircle className="w-4 h-4 text-indigo-400" />
                Chuyển sprint
                <ChevronUp className="w-3 h-3 text-gray-500 ml-1" />
              </button>
              {showSprintMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 max-h-56 overflow-y-auto">
                  <button
                    onClick={() => { onMoveSprint(null); setShowSprintMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors italic"
                  >
                    Backlog (không có sprint)
                  </button>
                  {sprints && sprints.length > 0 && (
                    <div className="border-t border-gray-700 mt-1 pt-1">
                      {sprints.map((sprint) => (
                        <button
                          key={sprint.id}
                          onClick={() => { onMoveSprint(sprint.id); setShowSprintMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {sprint.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit fields (optional) */}
          {onEditFields && (
            <button
              onClick={onEditFields}
              className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
              Sửa trường
            </button>
          )}

          {/* Delete */}
          {canDeleteTask && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 hover:bg-red-900/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onClear}
          className="ml-1 p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Bỏ chọn (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
