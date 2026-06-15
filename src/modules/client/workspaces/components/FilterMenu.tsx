import React, { useEffect } from 'react';
import { X, Check, UserRound } from 'lucide-react';

type FilterAssignee = {
  id: string;
  color?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
  initials?: string;
};

interface FilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFilters: (filters: any) => void;
  density: "compact" | "comfortable" | "spacious";
  setDensity: (val: "compact" | "comfortable" | "spacious") => void;
  assignees: FilterAssignee[];
}

export default function FilterMenu({ isOpen, onClose, filters, setFilters, density, setDensity, assignees }: FilterMenuProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (isOpen) onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        else setFilters((prev: any) => ({ ...prev }));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, setFilters]);

  if (!isOpen) return null;

  const getAssigneeLabel = (user: FilterAssignee) =>
    user.name || (user.id === 'U' ? 'Unassigned' : user.id);

  const getAssigneeInitials = (user: FilterAssignee) =>
    user.initials ||
    getAssigneeLabel(user)
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const toggleArrayFilter = (key: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFilters((prev: any) => {
      const arr = prev[key] || [];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  };

  const clearFilters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFilters((prev: any) => ({
      ...prev,
      assignees: [],
      types: [],
      statuses: []
    }));
  };

  return (
    <div
      className="absolute top-16 right-0 w-[min(calc(100vw-48px),var(--app-popover-w))] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] z-40 animate-in slide-in-from-top-2 duration-200"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <h4 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Filters</h4>
        <button onClick={onClose} className="p-1 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] rounded-[4px] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">

        {/* Assignees */}
        <div className="space-y-2">
          <h5 className="text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wide">Assignee</h5>
          <div className="flex flex-wrap gap-2">
            {assignees.map(user => {
              const isSelected = filters.assignees?.includes(user.id);
              const label = getAssigneeLabel(user);
              const detail = user.email || user.role;
              const initials = getAssigneeInitials(user);

              return (
                <button
                  key={user.id}
                  onClick={() => toggleArrayFilter('assignees', user.id)}
                  className={`flex min-w-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-[0.6875rem] font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] border-[#2563EB]/20 dark:border-[#2563EB]/20 text-[#1F6C9F] dark:text-[#93C5FD]'
                      : 'bg-white dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.08] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]'
                  }`}
                  title={detail ? `${label} - ${detail}` : label}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ${user.color || 'bg-[#2563EB]'} text-[0.5625rem] font-bold text-white`}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : initials ? (
                      initials
                    ) : (
                      <UserRound className="h-3 w-3" />
                    )}
                  </span>
                  <span className="max-w-32 truncate">{label}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Types */}
        <div className="space-y-2">
          <h5 className="text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wide">Work type</h5>
          <div className="grid grid-cols-2 gap-2">
            {['Task', 'Bug', 'Story', 'Epic'].map(type => {
              const isSelected = filters.types?.includes(type);
              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter('types', type)} className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer" />
                  <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-2">
          <h5 className="text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wide">Status</h5>
          <div className="grid grid-cols-2 gap-2">
            {['To Do', 'In Progress', 'Done'].map(status => {
              const isSelected = filters.statuses?.includes(status);
              return (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter('statuses', status)} className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer" />
                  <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{status}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2 pt-4 border-t border-[#EAEAEA] dark:border-white/[0.06]">
          <h5 className="text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wide">List density</h5>
          <div className="flex gap-2">
            <button
              onClick={() => setDensity('comfortable')}
              className={`flex-1 py-1.5 text-[0.8125rem] font-medium rounded-[6px] border transition-colors ${
                density === 'comfortable'
                  ? 'bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] border-[#2563EB]/20 text-[#1F6C9F] dark:text-[#93C5FD]'
                  : 'bg-white dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.08] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`flex-1 py-1.5 text-[0.8125rem] font-medium rounded-[6px] border transition-colors ${
                density === 'compact'
                  ? 'bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] border-[#2563EB]/20 text-[#1F6C9F] dark:text-[#93C5FD]'
                  : 'bg-white dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.08] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]'
              }`}
            >
              Compact
            </button>
          </div>
        </div>

      </div>
      <div className="p-3 border-t border-[#EAEAEA] dark:border-white/[0.06] flex justify-between items-center bg-[#F9F9F8] dark:bg-[#252525] rounded-b-[8px]">
        <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
          Shortcut:{' '}
          <kbd className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[4px] px-1 font-mono">Shift</kbd>
          {' '}+{' '}
          <kbd className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[4px] px-1 font-mono">F</kbd>
        </span>
        <button onClick={clearFilters} className="text-[0.8125rem] font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#2563EB] transition-colors">
          Clear filters
        </button>
      </div>
    </div>
  );
}
