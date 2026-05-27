"use client";

import type { EventContentArg } from '@fullcalendar/core';
import { isAfter, parseISO } from 'date-fns';
import { Issue } from '@/modules/client/workspaces/types/issue.type';

export default function CalendarEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { extendedProps, start, end } = eventInfo.event;

  // Sprint bar
  if (extendedProps.type === 'sprint') {
    return (
      <div className="flex items-center gap-1 px-1 w-full overflow-hidden">
        <span className="text-xs">⚡</span>
        <span className="text-xs text-white font-medium truncate">
          {eventInfo.event.title}
        </span>
      </div>
    );
  }

  const issue = extendedProps.rawData as Issue;
  const isDone = issue.status === 'Done';
  const isOverdue =
    issue.endDate &&
    isAfter(new Date(), parseISO(issue.endDate)) &&
    !isDone;

  // Multi-day bar: end is set and spans more than 1 day
  const isMultiDay =
    end != null &&
    start != null &&
    end.getTime() - start.getTime() > 86_400_000;

  if (isMultiDay) {
    return (
      <div className="flex items-center px-1 w-full overflow-hidden">
        <span
          className={[
            'text-xs text-white truncate',
            isDone ? 'line-through opacity-60' : '',
            isOverdue ? 'text-red-200' : '',
          ].join(' ')}
        >
          {issue.title}
        </span>
      </div>
    );
  }

  // Single-day dot style
  return (
    <div className="flex items-center gap-1 px-0.5 w-full overflow-hidden">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: eventInfo.event.backgroundColor ?? '#6366f1' }}
      />
      <span
        className={[
          'text-xs truncate',
          isDone ? 'line-through opacity-60' : '',
          isOverdue
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-800 dark:text-gray-200',
        ].join(' ')}
      >
        {issue.title}
      </span>
    </div>
  );
}
