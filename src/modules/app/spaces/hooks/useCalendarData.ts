import { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import type { EventInput } from '@fullcalendar/core';
import { Issue } from '../types/issue.type';
import { Sprint } from '../types/sprint.type';

function shiftDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd');
}

function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    Critical: '#ef4444',
    High:     '#f97316',
    Medium:   '#3b82f6',
    Low:      '#22c55e',
  };
  return map[priority] ?? '#6366f1';
}

export function useCalendarData(issues: Issue[], sprints: Sprint[]) {
  return useMemo(() => {
    const events: EventInput[] = [];
    const unscheduledTasks: Issue[] = [];

    for (const issue of issues) {
      if (!issue.startDate && !issue.endDate) {
        unscheduledTasks.push(issue);
        continue;
      }
      const start = issue.startDate ?? issue.endDate!;
      // FC uses exclusive end — add 1 day so the event renders on endDate
      const end = issue.endDate ? shiftDate(issue.endDate, 1) : undefined;
      const color = priorityColor(issue.priority);

      events.push({
        id: issue.id,
        title: issue.title,
        start,
        end,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { type: 'issue', rawData: issue },
      });
    }

    for (const sprint of sprints) {
      if (!sprint.startDate) continue;
      events.push({
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        start: sprint.startDate,
        end: sprint.endDate ? shiftDate(sprint.endDate, 1) : undefined,
        allDay: true,
        editable: false,
        classNames: ['sprint-event'],
        backgroundColor: '#4f46e5',
        borderColor: '#4338ca',
        extendedProps: { type: 'sprint', rawData: sprint },
      });
    }

    return { events, unscheduledTasks };
  }, [issues, sprints]);
}
