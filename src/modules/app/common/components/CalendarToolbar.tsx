"use client";

import { ChevronLeft, ChevronRight, AlignJustify } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { CalendarFilters, CalendarViewType } from '@/modules/app/spaces/types/calendar.type';

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
  'px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg ' +
  'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500';

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
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={`${SELECT_CLASS} w-44 placeholder-gray-400 dark:placeholder-gray-500`}
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
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => api()?.prev()}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => api()?.next()}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 min-w-[140px]">
            {currentDateTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Week toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
            {(['dayGridMonth', 'dayGridWeek'] as CalendarViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  currentView === view
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
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
              'p-1.5 rounded-lg border transition-colors',
              isSidebarOpen
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
