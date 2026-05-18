import { useCallback } from 'react';
import { format, subDays } from 'date-fns';
import type { EventDropArg, EventClickArg, EventReceiveArg } from '@fullcalendar/core';
import { Issue } from '../types/issue.type';

// EventResizeDoneArg from @fullcalendar/interaction in v6
// Using inline type to avoid import resolution issues; shape matches EventDropArg
type EventResizeArg = {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
    extendedProps: Record<string, unknown>;
  };
};

interface UseCalendarHandlersProps {
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function useCalendarHandlers({ onUpdateIssueDate, onSelectIssue }: UseCalendarHandlersProps) {
  const onEventDrop = useCallback((arg: EventDropArg) => {
    if (arg.event.extendedProps.type === 'sprint') return;
    const start = toDateStr(arg.event.start!);
    // FC end is exclusive — subtract 1 day to get the actual last day
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    onUpdateIssueDate(arg.event.id, start, end);
  }, [onUpdateIssueDate]);

  const onEventResize = useCallback((arg: EventResizeArg) => {
    if (arg.event.extendedProps.type === 'sprint') return;
    const start = arg.event.start ? toDateStr(arg.event.start) : '';
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    if (start) onUpdateIssueDate(arg.event.id, start, end);
  }, [onUpdateIssueDate]);

  const onEventReceive = useCallback((arg: EventReceiveArg) => {
    // Remove FC's internally created copy first — React state drives rendering
    arg.event.remove();
    const start = toDateStr(arg.event.start!);
    onUpdateIssueDate(arg.event.id, start, start);
  }, [onUpdateIssueDate]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    if (arg.event.extendedProps.type === 'issue') {
      onSelectIssue(arg.event.extendedProps.rawData as Issue);
    }
  }, [onSelectIssue]);

  return { onEventDrop, onEventResize, onEventReceive, onEventClick };
}
