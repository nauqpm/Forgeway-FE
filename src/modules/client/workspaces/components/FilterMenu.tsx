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
  filters: any;
  setFilters: (filters: any) => void;
  density: 'default' | 'compact';
  setDensity: (val: 'default' | 'compact') => void;
  assignees: FilterAssignee[];
}

export default function FilterMenu({ isOpen, onClose, filters, setFilters, density, setDensity, assignees }: FilterMenuProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (isOpen) onClose();
        else setFilters((prev: any) => ({ ...prev })); // trigger open in parent
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
    setFilters((prev: any) => ({
      ...prev,
      assignees: [],
      types: [],
      statuses: []
    }));
  };

  return (
    <div className="absolute top-16 right-0 w-[min(calc(100vw-48px),var(--app-popover-w))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-40 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white">Filters</h4>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
        
        {/* Assignees */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Assignee</h5>
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
                  className={`flex min-w-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  title={detail ? `${label} - ${detail}` : label}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ${user.color || 'bg-indigo-600'} text-[9px] font-bold text-white`}>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
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
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Work type</h5>
          <div className="grid grid-cols-2 gap-2">
            {['Task', 'Bug', 'Story', 'Epic'].map(type => {
              const isSelected = filters.types?.includes(type);
              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter('types', type)} className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</h5>
          <div className="grid grid-cols-2 gap-2">
            {['To Do', 'In Progress', 'Done'].map(status => {
              const isSelected = filters.statuses?.includes(status);
              return (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter('statuses', status)} className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">List density</h5>
          <div className="flex gap-2">
            <button onClick={() => setDensity('default')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg border ${density === 'default' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              Default
            </button>
            <button onClick={() => setDensity('compact')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg border ${density === 'compact' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              Compact
            </button>
          </div>
        </div>

      </div>
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
        <span className="text-xs text-gray-400 dark:text-gray-500">Shortcut: <kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1">Shift</kbd> + <kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1">F</kbd></span>
        <button onClick={clearFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400">
          Clear filters
        </button>
      </div>
    </div>
  );
}
