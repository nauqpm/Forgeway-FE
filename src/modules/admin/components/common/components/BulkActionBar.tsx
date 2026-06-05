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
      <div
        className="bg-[#202020] text-[#E8E8E7] rounded-[10px] px-4 py-3 flex items-center gap-3 border border-white/8"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/8">
          <div className="bg-[#2563EB] w-6 h-6 rounded-[4px] flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-[#9B9A97]">selected</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Status dropdown */}
          {canEditTask && (
          <div ref={statusRef} className="relative">
            <button
              onClick={() => { setShowStatusMenu(!showStatusMenu); setShowSprintMenu(false); }}
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
                {['To Do', 'In Progress', 'Done'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { onChangeStatus(status); setShowStatusMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#9B9A97] hover:bg-white/8 hover:text-[#E8E8E7] transition-colors"
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
                className="flex items-center gap-2 hover:bg-white/8 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors text-[#9B9A97] hover:text-[#E8E8E7]"
              >
                <ArrowRightCircle className="w-4 h-4 text-[#3B82F6]" />
                Move sprint
                <ChevronUp className="w-3 h-3 text-[#6B6B6B] ml-1" />
              </button>
              {showSprintMenu && (
                <div
                  className="absolute bottom-full mb-2 left-0 w-52 bg-[#202020] border border-white/8 rounded-[8px] overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 max-h-56 overflow-y-auto"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <button
                    onClick={() => { onMoveSprint(null); setShowSprintMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#6B6B6B] hover:bg-white/8 hover:text-[#E8E8E7] transition-colors italic"
                  >
                    Backlog (no sprint)
                  </button>
                  {sprints && sprints.length > 0 && (
                    <div className="border-t border-white/8 mt-1 pt-1">
                      {sprints.map((sprint) => (
                        <button
                          key={sprint.id}
                          onClick={() => { onMoveSprint(sprint.id); setShowSprintMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-[#9B9A97] hover:bg-white/8 hover:text-[#E8E8E7] transition-colors"
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
              className="flex items-center gap-2 hover:bg-white/8 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors text-[#9B9A97] hover:text-[#E8E8E7]"
            >
              <Edit2 className="w-4 h-4" />
              Edit fields
            </button>
          )}

          {/* Delete */}
          {canDeleteTask && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 hover:bg-[rgba(159,47,45,0.12)] text-[#F87171] hover:text-[#FCA5A5] px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onClear}
          className="ml-1 p-1.5 hover:bg-white/8 rounded-[6px] text-[#6B6B6B] hover:text-[#E8E8E7] transition-colors"
          title="Deselect (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
