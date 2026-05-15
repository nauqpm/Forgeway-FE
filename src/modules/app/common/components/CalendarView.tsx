"use client";

import { useRef, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import CalendarToolbar from './CalendarToolbar';
import UnscheduledSidebar from './UnscheduledSidebar';
import CalendarEventContent from './CalendarEventContent';

import { Issue } from '@/modules/app/spaces/types/issue.type';
import { Sprint } from '@/modules/app/spaces/types/sprint.type';
import { CalendarViewType, CalendarFilters } from '@/modules/app/spaces/types/calendar.type';
import { useCalendarData } from '@/modules/app/spaces/hooks/useCalendarData';
import { useCalendarHandlers } from '@/modules/app/spaces/hooks/useCalendarHandlers';
import { useAssignees } from '@/modules/app/spaces/hooks/useAssignees';

interface CalendarViewProps {
  issues: Issue[];
  sprints: Sprint[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
}

export default function CalendarView({
  issues,
  sprints,
  onUpdateIssueDate,
  onSelectIssue,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDateTitle, setCurrentDateTitle] = useState('');
  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const handlers = useCalendarHandlers({ onUpdateIssueDate, onSelectIssue });
  const assignees = useAssignees(issues);

  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  return (
    <div className="flex h-full overflow-hidden gap-0">
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

        <div className="flex-1 overflow-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable
            droppable
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
    </div>
  );
}
