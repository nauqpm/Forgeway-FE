"use client";

import { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DayCellContentArg, EventApi, EventSegment, MoreLinkArg } from '@fullcalendar/core';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

import CalendarToolbar from './CalendarToolbar';
import UnscheduledSidebar from './UnscheduledSidebar';
import CalendarEventContent from './CalendarEventContent';

import { Issue } from '@/modules/workspace/shared/types/issue.type';
import { Sprint } from '@/modules/workspace/shared/types/sprint.type';
import { CalendarViewType, CalendarFilters } from '@/modules/workspace/shared/types/calendar.type';
import { useCalendarData } from '@/modules/workspace/shared/hooks/useCalendarData';
import { useCalendarHandlers } from '@/modules/workspace/shared/hooks/useCalendarHandlers';
import { useAssignees } from '@/modules/workspace/shared/hooks/useAssignees';
import { toCalendarDateKey } from '@/modules/workspace/shared/utils/calendarDateKey';

// Minimal event shape used by the popover — works for both EventApi and OverflowEntry
type MorePopoverState = {
  date: Date;
  dateTitle: string;
  events: EventApi[];
  anchorEl: HTMLElement;
};

type PopoverPosition = {
  left: number;
  top: number;
};

function getIssueDisplay(issue: Issue) {
  const anyIssue = issue as Issue & {
    assigneeDisplayName?: string;
    assignee?: unknown;
  };
  const rawAssignee = anyIssue.assignee;
  const assignee =
    typeof rawAssignee === 'object' && rawAssignee
      ? (rawAssignee as { fullName?: string; email?: string; avatar?: string })
      : null;
  const assigneeName =
    anyIssue.assigneeDisplayName ||
    assignee?.fullName ||
    assignee?.email ||
    issue.assigneeId ||
    issue.assignee ||
    'U';
  const initials = assigneeName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    key: issue.key || issue.id,
    assigneeName,
    assigneeAvatar: assignee?.avatar,
    initials,
  };
}

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
  const calendarShellRef = useRef<HTMLDivElement>(null);
  const morePopoverRef = useRef<HTMLDivElement>(null);
  const [currentDateTitle, setCurrentDateTitle] = useState('');
  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quickCreate, setQuickCreate] = useState<{ date: string; title: string } | null>(null);
  const [morePopover, setMorePopover] = useState<MorePopoverState | null>(null);
  const [morePopoverPosition, setMorePopoverPosition] = useState<PopoverPosition | null>(null);
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

  // Auto-close only on transition from tasks → no tasks; guards against API rollback reopening issue
  const prevUnscheduledCount = useRef(unscheduledTasks.length);
  useEffect(() => {
    const prev = prevUnscheduledCount.current;
    prevUnscheduledCount.current = unscheduledTasks.length;
    if (prev > 0 && unscheduledTasks.length === 0) setIsSidebarOpen(false);
  }, [unscheduledTasks.length]);

  // Reflow calendar when container resizes (e.g. sidebar collapse/expand)
  useEffect(() => {
    const el = calendarShellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const assignees = useAssignees(issues);

  useLayoutEffect(() => {
    if (!morePopover) {
      setMorePopoverPosition(null);
      return;
    }

    const anchorRect = morePopover.anchorEl.getBoundingClientRect();
    const popoverRect = morePopoverRef.current?.getBoundingClientRect();
    const width = popoverRect?.width ?? 360;
    const height = popoverRect?.height ?? 320;
    const margin = 12;
    const preferredLeft = anchorRect.right + 8;
    const preferredTop = anchorRect.top;
    const left = Math.min(
      Math.max(margin, preferredLeft),
      window.innerWidth - width - margin,
    );
    const top = Math.min(
      Math.max(margin, preferredTop),
      window.innerHeight - height - margin,
    );

    setMorePopoverPosition({ left, top });
  }, [morePopover]);

  useEffect(() => {
    if (!morePopover) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (morePopoverRef.current?.contains(target)) return;
      if (morePopover.anchorEl.contains(target)) return;
      setMorePopover(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMorePopover(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [morePopover]);

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

  const handleMoreLinkClick = useCallback((arg: MoreLinkArg): string => {
    arg.jsEvent.preventDefault();
    arg.jsEvent.stopPropagation();
    const anchorEl = arg.jsEvent.currentTarget as HTMLElement | null;
    if (!anchorEl) return arg.view.type;

    setMorePopover({
      date: arg.date,
      dateTitle: format(arg.date, 'MMMM d'),
      events: arg.allSegs.map((seg: EventSegment) => seg.event),
      anchorEl,
    });

    return arg.view.type;
  }, []);

  const renderPopoverEvent = (event: EventApi) => {
    const type = event.extendedProps.type;

    if (type === 'sprint') {
      const sprint = event.extendedProps.rawData as Sprint;
      return (
        <div
          key={event.id}
          className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
          <span className="w-16 shrink-0 truncate text-[0.6875rem] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6]">
            Sprint
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold text-[#111111] dark:text-[#E8E8E7]">
            {sprint.name}
          </span>
          <span className="shrink-0 rounded-[4px] bg-[#EFF6FF] px-1.5 py-0.5 text-[0.625rem] font-bold text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
            {sprint.status}
          </span>
        </div>
      );
    }

    const issue = event.extendedProps.rawData as Issue;
    const display = getIssueDisplay(issue);
    return (
      <button
        key={event.id}
        type="button"
        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-sm hover:bg-[#F7F6F3] dark:hover:bg-white/5"
        onClick={(clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          onSelectIssue(issue);
        }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: event.backgroundColor || '#6366f1' }}
        />
        <span className="w-20 shrink-0 truncate text-[0.6875rem] font-bold uppercase text-[#787774] dark:text-[#9B9A97]">
          {display.key}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-[#111111] dark:text-[#E8E8E7]">
          {issue.title}
        </span>
        <span className="shrink-0 rounded-[4px] bg-[#F7F6F3] px-1.5 py-0.5 text-[0.625rem] font-bold text-[#787774] dark:bg-[#252525] dark:text-[#9B9A97]">
          {issue.status}
        </span>
        <span
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-[0.625rem] font-bold text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]"
          title={display.assigneeName}
        >
          {display.assigneeAvatar ? (
            <img src={display.assigneeAvatar} alt={display.assigneeName} className="h-full w-full object-cover" />
          ) : (
            display.initials
          )}
        </span>
      </button>
    );
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

        <div ref={calendarShellRef} className="flex-1 overflow-auto al-calendar-shell">
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
            moreLinkContent={(arg) => `+ ${arg.num} more`}
            moreLinkClassNames="al-calendar-more-link"
            moreLinkClick={handleMoreLinkClick}
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
        <div
          className="absolute right-4 top-20 z-50 w-80 rounded-[10px] border border-[#EAEAEA] bg-white p-4 dark:border-white/[0.06] dark:bg-[#202020]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">Create work item</p>
              <p className="text-xs font-medium text-[#787774] dark:text-[#9B9A97]">{quickCreate.date}</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-[6px] p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:bg-white/5 dark:hover:text-[#9B9A97]"
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
              className="w-full rounded-[6px] border border-[#EAEAEA] bg-white px-3 py-2 text-sm font-medium text-[#111111] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#E8E8E7]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickCreate(null)}
                className="rounded-[6px] px-3 py-2 text-sm font-semibold text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quickCreate.title.trim() || isCreating}
                className="rounded-[6px] bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {morePopover && (
        <div
          ref={morePopoverRef}
          className="fixed z-[70] w-[22.5rem] max-w-[calc(100vw-24px)] rounded-[10px] border border-[#EAEAEA] bg-white p-3 dark:border-white/[0.06] dark:bg-[#202020]"
          style={{
            left: morePopoverPosition?.left ?? -9999,
            top: morePopoverPosition?.top ?? -9999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div className="mb-2 flex items-center gap-3 border-b border-[#EAEAEA] pb-2 dark:border-white/[0.06]">
            <p className="text-sm font-bold text-[#111111] dark:text-[#E8E8E7]">{morePopover.dateTitle}</p>
            <button
              type="button"
              className="ml-auto rounded-[6px] p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:bg-white/5 dark:hover:text-[#9B9A97]"
              onClick={() => setMorePopover(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[21.25rem] overflow-y-auto pr-1">
            {morePopover.events.map(renderPopoverEvent)}
          </div>
        </div>
      )}
    </div>
  );
}
