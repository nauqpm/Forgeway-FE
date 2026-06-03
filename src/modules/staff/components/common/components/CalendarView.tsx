"use client";

import { useRef, useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DayCellContentArg } from '@fullcalendar/core';
import { Plus, X } from 'lucide-react';

import CalendarToolbar from './CalendarToolbar';
import UnscheduledSidebar from './UnscheduledSidebar';
import CalendarEventContent from './CalendarEventContent';

import { Issue } from '@/modules/client/workspaces/types/issue.type';
import { Sprint } from '@/modules/client/workspaces/types/sprint.type';
import { CalendarViewType, CalendarFilters } from '@/modules/client/workspaces/types/calendar.type';
import { useCalendarData } from '@/modules/client/workspaces/hooks/useCalendarData';
import { useCalendarHandlers } from '@/modules/client/workspaces/hooks/useCalendarHandlers';
import { useAssignees } from '@/modules/client/workspaces/hooks/useAssignees';
import { toCalendarDateKey } from '@/modules/client/workspaces/utils/calendarDateKey';

interface CalendarViewProps {
  issues: Issue[];
  sprints: Sprint[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
  onQuickCreateTask?: (title: string, date: string) => Promise<void> | void;
}

export default function CalendarView({
  issues,
  sprints,
  onUpdateIssueDate,
  onSelectIssue,
  onQuickCreateTask,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDateTitle, setCurrentDateTitle] = useState('');
  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quickCreate, setQuickCreate] = useState<{ date: string; title: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    search: '',
    assignees: [],
    types: [],
    statuses: [],
  });

  // Apply calendar-local filters
  const filteredIssues = useMemo(
    () =>
      issues.filter((issue) => {
        if (
          filters.search &&
          !issue.title.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        if (filters.assignees.length && !filters.assignees.includes(issue.assignee))
          return false;
        if (filters.types.length && !filters.types.includes(issue.type))
          return false;
        if (filters.statuses.length && !filters.statuses.includes(issue.status))
          return false;
        return true;
      }),
    [issues, filters]
  );

  const { events, unscheduledTasks } = useCalendarData(filteredIssues, sprints);
  const handlers = useCalendarHandlers({
    issues: filteredIssues,
    sprints,
    onUpdateIssueDate,
    onSelectIssue,
  });

  // Auto-close when all tasks are scheduled
  useEffect(() => {
    if (unscheduledTasks.length === 0) setIsSidebarOpen(false);
  }, [unscheduledTasks.length]);
  const assignees = useAssignees(issues);

  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  const openQuickCreate = (date: Date) => {
    const dateKey = toCalendarDateKey(date);
    setQuickCreate({ date: dateKey, title: '' });
  };

  const renderDayCellContent = (arg: DayCellContentArg) => (
    <div className="al-calendar-day-head">
      <span className="al-calendar-day-number">{arg.dayNumberText}</span>
      {onQuickCreateTask && (
        <button
          type="button"
          title="Create work item"
          aria-label="Create work item"
          className="al-calendar-create-btn"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openQuickCreate(arg.date);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const handleQuickCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickCreate || !quickCreate.title.trim() || !onQuickCreateTask || isCreating) return;

    setIsCreating(true);
    try {
      await onQuickCreateTask(quickCreate.title.trim(), quickCreate.date);
      setQuickCreate(null);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden gap-3">
      {/* Main calendar area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <CalendarToolbar
          calendarRef={calendarRef as React.RefObject<FullCalendar>}
          currentDateTitle={currentDateTitle}
          currentView={currentView}
          onViewChange={handleViewChange}
          filters={filters}
          onFiltersChange={setFilters}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          assignees={assignees}
        />

        <div className="flex-1 overflow-auto al-calendar-shell">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable
            eventResizableFromStart
            droppable
            eventDragMinDistance={10}
            eventLongPressDelay={2500}
            longPressDelay={2500}
            dayMaxEventRows={4}
            moreLinkContent={(arg) => `${arg.num} more`}
            moreLinkClassNames="al-calendar-more-link"
            dayCellContent={renderDayCellContent}
            eventContent={(arg) => <CalendarEventContent eventInfo={arg} />}
            eventDrop={handlers.onEventDrop}
            eventResize={handlers.onEventResize}
            eventReceive={handlers.onEventReceive}
            eventClick={handlers.onEventClick}
            datesSet={(arg) => setCurrentDateTitle(arg.view.title)}
            headerToolbar={false}
            height="auto"
          />
        </div>
      </div>

      {/* Unscheduled sidebar */}
      <UnscheduledSidebar
        tasks={unscheduledTasks}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {quickCreate && (
        <div className="absolute right-4 top-20 z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-950">
          <div className="mb-3 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Create work item</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{quickCreate.date}</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              onClick={() => setQuickCreate(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleQuickCreateSubmit} className="space-y-3">
            <input
              autoFocus
              value={quickCreate.title}
              onChange={(event) => setQuickCreate((current) => current ? { ...current, title: event.target.value } : current)}
              placeholder="Work item title"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickCreate(null)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quickCreate.title.trim() || isCreating}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
