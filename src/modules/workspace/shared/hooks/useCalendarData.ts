import { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import type { EventInput } from '@fullcalendar/core';
import { Issue } from '../types/issue.type';
import { Sprint } from '../types/sprint.type';

function shiftDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd');
}

const CALENDAR_EVENT_BG = '#2563EB';
const CALENDAR_EVENT_BORDER = 'rgba(37, 99, 235, 0.18)';

export function useCalendarData(issues: Issue[], sprints: Sprint[]) {
  return useMemo(() => {
    const events: EventInput[] = [];
    const unscheduledTasks: Issue[] = [];

    for (const issue of issues) {
      if (!issue.startDate && !issue.dueDate) {
        unscheduledTasks.push(issue);
        continue;
      }
      const start = issue.startDate ?? issue.dueDate!;
      // FC uses exclusive end — add 1 day so the event renders on dueDate
      const end = shiftDate(issue.dueDate ?? start, 1);
      events.push({
        id: issue.id,
        title: issue.title,
        start,
        end,
        allDay: true,
        display: 'block',
        backgroundColor: CALENDAR_EVENT_BG,
        borderColor: CALENDAR_EVENT_BORDER,
        extendedProps: { type: 'issue', rawData: issue },
      });
    }

    for (const sprint of sprints) {
      if (!sprint.startDate) continue;
      const sprintEnd = shiftDate(sprint.endDate ?? sprint.startDate, 1);
      events.push({
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        start: sprint.startDate,
        end: sprintEnd,
        allDay: true,
        display: 'block',
        editable: false,
        classNames: ['sprint-event'],
        backgroundColor: CALENDAR_EVENT_BG,
        borderColor: CALENDAR_EVENT_BORDER,
        extendedProps: { type: 'sprint', rawData: sprint },
      });
    }

    return { events, unscheduledTasks };
  }, [issues, sprints]);
}
