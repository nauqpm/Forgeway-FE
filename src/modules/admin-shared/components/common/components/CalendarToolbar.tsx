"use client";

import { ChevronLeft, ChevronRight, AlignJustify } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { CalendarFilters, CalendarViewType } from '@/modules/workspace/shared/types/calendar.type';

interface CalendarToolbarProps {
  calendarRef: React.RefObject<FullCalendar>;
  currentDateTitle: string;
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  filters: CalendarFilters;
  onFiltersChange: (f: CalendarFilters) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  assignees: { id: string; color: string }[];
}

const SELECT_CLASS =
  'px-2.5 py-1.5 text-sm font-medium border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] ' +
  'bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20';

export default function CalendarToolbar({
  calendarRef,
  currentDateTitle,
  currentView,
  onViewChange,
  filters,
  onFiltersChange,
  isSidebarOpen,
  onToggleSidebar,
  assignees,
}: CalendarToolbarProps) {
  const api = () => calendarRef.current?.getApi();

  return (
    <div className="flex flex-col gap-2 mb-2">
      {/* Row 1: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={`${SELECT_CLASS} w-44 placeholder-[#ABABAB] dark:placeholder-[#6B6B6B]`}
        />

        <select
          value={filters.assignees[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, assignees: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Assignees</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id}
            </option>
          ))}
        </select>

        <select
          value={filters.types[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, types: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Types</option>
          {['Task', 'Bug', 'Story', 'Epic'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filters.statuses[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, statuses: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Statuses</option>
          {['To Do', 'In Progress', 'Done'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Nav + View switch + Sidebar toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => api()?.today()}
            className="px-3 py-1.5 text-sm font-semibold rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => api()?.prev()}
            className="p-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => api()?.next()}
            className="p-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-base font-bold text-[#111111] dark:text-[#E8E8E7] min-w-[9.375rem]">
            {currentDateTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Week toggle */}
          <div className="flex bg-[#F7F6F3] dark:bg-[#252525] rounded-[8px] p-1 gap-1">
            {(['dayGridMonth', 'dayGridWeek'] as CalendarViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-[6px] transition-all',
                  currentView === view
                    ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]'
                    : 'text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]',
                ].join(' ')}
              >
                {view === 'dayGridMonth' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>

          {/* Unscheduled sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            title="Unscheduled work"
            className={[
              'p-1.5 rounded-[6px] border transition-colors',
              isSidebarOpen
                ? 'border-[#2563EB]/30 dark:border-[#3B82F6]/40 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]'
                : 'border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5',
            ].join(' ')}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
